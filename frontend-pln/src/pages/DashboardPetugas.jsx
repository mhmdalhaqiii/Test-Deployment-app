import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Spinner, Button, Modal, Offcanvas, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';

// Pembeda Warna Pin Aset
const assetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [12, 20],
    iconAnchor: [6, 20],
    popupAnchor: [1, -20],
    shadowSize: [20, 20]
});

// Pembeda Warna Pin Aset Selesai
const assetIconSelesai = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [12, 20],
    iconAnchor: [6, 20],
    popupAnchor: [1, -20],
    shadowSize: [20, 20]
});

// Pin target petugas
const targetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Komponen untuk loncat titik peta pertama kali
function ChangeMapView({ coords }) {
    const map = useMap();

    useEffect(() => {
        if (coords) {
            map.setView(coords, 13);
        }
    }, [coords, map]);

    return null;
}

function MapTracker({ onChange }) {
    const map = useMap();

    useEffect(() => {
        const updateMapState = () => {
            const bounds = map.getBounds();

            onChange({
                zoom: map.getZoom(),
                bounds: {
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLng: bounds.getWest(),
                    maxLng: bounds.getEast(),
                },
            });
        };

        updateMapState();

        map.on('zoomend moveend', updateMapState);

        return () => {
            map.off('zoomend moveend', updateMapState);
        };
    }, [map, onChange]);

    return null;
}

export default function DashboardPetugas() {
    const navigate = useNavigate();

    // State User
    const [user] = useState(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : { name: "Petugas" };
    });

    // State Map & Data
    const [semuaAset, setSemuaAset] = useState([]);
    const [spkData, setSpkData] = useState([]);
    const [pekerjaanDiambil, setPekerjaanDiambil] = useState([]);
    const [riwayatData, setRiwayatData] = useState([]);

    // State UI
    const [loadingAset, setLoadingAset] = useState(true);
    const [loadingSPK, setLoadingSPK] = useState(false);
    const [showRekomendasi, setShowRekomendasi] = useState(false);
    const [showPekerjaanList, setShowPekerjaanList] = useState(false);

    const [showRiwayat, setShowRiwayat] = useState(false);
    const [loadingRiwayat, setLoadingRiwayat] = useState(false);

    const [riwayatPage, setRiwayatPage] = useState(1);
    const [riwayatMeta, setRiwayatMeta] = useState(null);

    const [ambilTiketLoadingId, setAmbilTiketLoadingId] = useState(null);
    const [mulaiProsesLoadingId, setMulaiProsesLoadingId] = useState(null);

    // State Modal Notifikasi Kustom
    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true
    });

    // Default Center UP3 Palembang
    const defaultCenter = [-2.9909, 104.7566];
    const [lokasiTarget, setLokasiTarget] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(13);
    const [mapBounds, setMapBounds] = useState(null);

    const MIN_ZOOM_MARKER = 14;

    const fetchAsetMap = useCallback(async (bounds, zoom) => {
        if (!bounds || zoom < MIN_ZOOM_MARKER) {
            setSemuaAset([]);
            setLoadingAset(false);
            return;
        }

        try {
            setLoadingAset(true);

            const response = await api.get('/maps/aset-petugas', {
                params: {
                    minLat: bounds.minLat,
                    maxLat: bounds.maxLat,
                    minLng: bounds.minLng,
                    maxLng: bounds.maxLng,
                    limit: 200,
                },
            });

            setSemuaAset(response.data.data || []);
        } catch (error) {
            console.error('Gagal memuat aset map:', error.response?.data || error);
        } finally {
            setLoadingAset(false);
        }
    }, []);

    const fetchPekerjaanAktif = async () => {
        try {
            const response = await api.get('/tiket-aktif-saya');

            if (response.data.success) {
                setPekerjaanDiambil(response.data.data);
            }
        } catch (error) {
            console.error("Gagal sinkronisasi data pekerjaan", error);
        }
    };

    const fetchRiwayatPekerjaan = async (page = 1, append = false) => {
        try {
            setLoadingRiwayat(true);

            const response = await api.get('/riwayat-pekerjaan-saya', {
                params: {
                    page,
                    per_page: 10,
                },
            });

            const data = response.data.data || [];
            const meta = response.data.meta || null;

            setRiwayatData((prev) => {
                if (append) {
                    return [...prev, ...data];
                }

                return Array.isArray(data) ? data : [];
            });

            setRiwayatMeta(meta);
            setRiwayatPage(page);
        } catch (error) {
            console.error("Gagal sinkronisasi data riwayat", error.response?.data || error);
        } finally {
            setLoadingRiwayat(false);
        }
    };

    useEffect(() => {
        fetchPekerjaanAktif();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLokasiTarget([position.coords.latitude, position.coords.longitude]);
                },
                (error) => console.log("Gagal akses GPS, pakai default Palembang", error)
            );
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pin target bisa digeser
    const handleDragEnd = (e) => {
        const marker = e.target;
        const position = marker.getLatLng();

        setLokasiTarget([position.lat, position.lng]);
    };

    // Tombol ambil rekomendasi area dari SPK
    const handleAmbilRekomendasi = async () => {
        setLoadingSPK(true);

        try {
            const latTarget = lokasiTarget[0];
            const lngTarget = lokasiTarget[1];

            const response = await api.get('/spk/prioritas', {
                params: {
                    lat: latTarget,
                    lng: lngTarget,
                    radius: 5,
                    limit: 10,
                }
            });

            const dataPrioritas = response.data.data || [];

            const dataDenganNomorAsli = dataPrioritas.map((item, index) => ({
                ...item,
                nomor_prioritas_asli: index + 1,
            }));

            setSpkData(dataDenganNomorAsli);
            setShowRekomendasi(true);

        } catch (error) {
            console.error("Gagal mengambil data SPK", error);

            if (error.response?.status === 401) {
                setModalNotif({
                    show: true,
                    title: 'Sesi Habis',
                    message: 'Sesi Anda telah habis. Silakan login kembali.',
                    isSuccess: false
                });

                setTimeout(() => {
                    handleLogout();
                }, 1500);
            } else {
                setModalNotif({
                    show: true,
                    title: 'Gagal Mengambil Rekomendasi',
                    message: 'Terjadi kesalahan saat menghubungi server SPK.',
                    isSuccess: false
                });
            }
        } finally {
            setLoadingSPK(false);
        }
    };

    const handleAmbilTiket = async (tiket) => {
        const tiketId = tiket.tiket_id || tiket.id;

        if (!tiketId || ambilTiketLoadingId) return;

        try {
            setAmbilTiketLoadingId(tiketId);

            const response = await api.post('/tiket/ambil-pekerjaan', {
                tiket_ids: [tiketId],
            });

            if (response.data.success) {
                setSpkData(prevData =>
                    prevData.filter(item => (item.tiket_id || item.id) !== tiketId)
                );

                setModalNotif({
                    show: true,
                    title: 'Berhasil',
                    message: 'Tiket berhasil diambil. Silakan periksa di menu Pekerjaan Hari Ini.',
                    isSuccess: true
                });

                fetchPekerjaanAktif();
            } else {
                setModalNotif({
                    show: true,
                    title: 'Gagal',
                    message: response.data.message || 'Gagal mengambil tiket.',
                    isSuccess: false
                });
            }
        } catch (error) {
            console.error("Gagal ambil tiket", error);

            setModalNotif({
                show: true,
                title: 'Gagal Mengambil Tiket',
                message: error.response?.data?.message || 'Terjadi kesalahan saat mengambil tiket.',
                isSuccess: false
            });
        } finally {
            setAmbilTiketLoadingId(null);
        }
    };

    const handleMulaiProses = async (tiket) => {
        const tiketId = tiket.tiket_id || tiket.id;

        if (!tiketId || mulaiProsesLoadingId) return;

        try {
            setMulaiProsesLoadingId(tiketId);

            const response = await api.post(`/tiket/${tiketId}/mulai`);

            if (response.data.success) {
                setModalNotif({
                    show: true,
                    title: 'Pekerjaan Dimulai! 🚀',
                    message: 'Status tiket berhasil diubah menjadi "Dikerjakan". Mengalihkan ke form laporan...',
                    isSuccess: true
                });

                // Sinkronisasi jalan di belakang, jangan bikin user nunggu lama
                fetchPekerjaanAktif();

                setTimeout(() => {
                    setModalNotif(prev => ({ ...prev, show: false }));
                    navigate(`/pekerjaan/${tiketId}`);
                }, 800);
            } else {
                setModalNotif({
                    show: true,
                    title: 'Gagal',
                    message: 'Gagal memulai pekerjaan.',
                    isSuccess: false
                });
            }
        } catch (error) {
            console.error("Gagal mulai proses", error);

            setModalNotif({
                show: true,
                title: 'Error',
                message: error.response?.data?.message || 'Terjadi kesalahan saat memulai pekerjaan.',
                isSuccess: false
            });
        } finally {
            setMulaiProsesLoadingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'inReview':
                return {
                    label: 'Menunggu Review Admin',
                    variant: 'warning',
                    iconColor: '#ffc107',
                    borderClass: 'border-warning'
                };

            case 'menungguValidasi':
                return {
                    label: 'Menunggu Validasi Manager',
                    variant: 'info',
                    iconColor: '#0dcaf0',
                    borderClass: 'border-info'
                };

            case 'selesai':
                return {
                    label: 'Selesai',
                    variant: 'success',
                    iconColor: '#198754',
                    borderClass: 'border-success'
                };

            default:
                return {
                    label: status || '-',
                    variant: 'secondary',
                    iconColor: '#6c757d',
                    borderClass: 'border-secondary'
                };
        }
    };

    const riwayatNotifCount = riwayatData.filter((item) => {
        const status = item.status || item.tiket?.status;

        return ['inReview', 'menungguValidasi'].includes(status);
    }).length;

    const handleOpenRiwayat = async () => {
        setShowRiwayat(true);
        setRiwayatData([]);
        setRiwayatMeta(null);
        setRiwayatPage(1);

        await fetchRiwayatPekerjaan(1, false);
    };

    const handleLoadMoreRiwayat = async () => {
        if (!riwayatMeta?.has_more || loadingRiwayat) return;

        await fetchRiwayatPekerjaan(riwayatPage + 1, true);
    };

    const handleMapChange = useCallback((payload) => {
        setMapZoom(payload.zoom);
        setMapBounds(payload.bounds);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAsetMap(mapBounds, mapZoom);
        }, 500);

        return () => clearTimeout(timer);
    }, [mapBounds, mapZoom, fetchAsetMap]);

    const asetTampilDiMap = useMemo(() => {
        return semuaAset;
    }, [semuaAset]);

    const markerBelumMuncul = !loadingAset && mapZoom < MIN_ZOOM_MARKER;

    return (
        <div style={{ position: 'relative', height: '100dvh', width: '100vw', overflow: 'hidden' }}>

            {/* MODAL NOTIFIKASI KUSTOM */}
            <Modal show={modalNotif.show} onHide={() => setModalNotif({ ...modalNotif, show: false })} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-3">
                        {modalNotif.isSuccess ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#198754" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#dc3545" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                            </svg>
                        )}
                    </div>

                    <h5 className="fw-bold mb-2">{modalNotif.title}</h5>
                    <p className="text-muted small mb-4">{modalNotif.message}</p>

                    <Button
                        variant={modalNotif.isSuccess ? "success" : "danger"}
                        className="w-100 rounded-pill"
                        onClick={() => setModalNotif({ ...modalNotif, show: false })}
                    >
                        Mengerti
                    </Button>
                </Modal.Body>
            </Modal>

            {/* MAP */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
                <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ChangeMapView coords={lokasiTarget} />
                    <MapTracker onChange={handleMapChange} />

                    {/* PIN ASET */}
                    {!loadingAset && asetTampilDiMap.map((aset) => {
                        const coords = [Number(aset.lat), Number(aset.lng)];

                        if (isNaN(coords[0]) || isNaN(coords[1])) return null;

                        const isSelesai = aset.status_pekerjaan === 'selesai';
                        const iconDipakai = isSelesai ? assetIconSelesai : assetIcon;

                        return (
                            <Marker key={aset.id} position={coords} icon={iconDipakai}>
                                <Popup>
                                    <div className="small">
                                        <strong style={{ color: '#0c2b4d' }}>
                                            {aset.pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                                        </strong>
                                        <br />
                                        Merk: {aset.merek_kwh || aset.merk_meter || '-'}
                                        <br />
                                        Status: <Badge bg={isSelesai ? 'success' : 'secondary'} className="mt-1">
                                            {isSelesai ? 'Selesai' : 'Belum'}
                                        </Badge>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* PIN TARGET */}
                    <Marker
                        position={lokasiTarget}
                        draggable={true}
                        icon={targetIcon}
                        eventHandlers={{
                            dragend: handleDragEnd,
                        }}
                    >
                        <Popup>
                            <strong>Titik Target Pekerjaan</strong>
                            <br />
                            Geser pin ini ke daerah yang ingin Anda kerjakan hari ini.
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* HEADER FLOATING */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bg-white px-3 py-2 shadow-sm rounded-pill d-flex align-items-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png" alt="PLN" width="20" className="me-2" />
                    <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                        UP3 Palembang
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {loadingAset && (
                        <Badge bg="info" className="shadow-sm">
                            Memuat Aset...
                        </Badge>
                    )}

                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#0c2b4d',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                </div>
            </div>

            {/* ALERT PETUNJUK GESER PIN */}
            <div style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '90%', maxWidth: '350px' }}>
                <Alert
                    variant="warning"
                    className="py-2 px-3 shadow-sm rounded-pill text-center border-0"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(255, 243, 205, 0.92)',
                    }}
                >
                    {markerBelumMuncul
                        ? '🔍 Zoom lebih dekat untuk melihat titik aset • Geser Pin Emas untuk pilih area'
                        : '💡 Tahan & geser Pin Emas untuk memilih target area'}
                </Alert>
            </div>

            {/* TOMBOL AMBIL REKOMENDASI */}
            <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '90%', maxWidth: '350px' }}>
                <Button
                    className="w-100 fw-bold py-3 shadow-lg"
                    style={{
                        backgroundColor: '#0c2b4d',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={handleAmbilRekomendasi}
                    disabled={loadingSPK}
                >
                    {loadingSPK ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Menghitung Jarak & SPK...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-magic me-2" viewBox="0 0 16 16">
                                <path d="M9.5 2.672a.5.5 0 1 0 1 .756l.814-.543.543.814a.5.5 0 0 0 .832-.556l-.543-.813.814-.543a.5.5 0 1 0-.556-.832l-.814.543-.543-.814a.5.5 0 0 0-.832.556l.543.813-.814.543a.5.5 0 0 0 .556.832l.814-.543zM3 9.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-2v-2a.5.5 0 0 0-.5-.5z" />
                                <path d="M2.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-2h2a.5.5 0 0 0 0-1h-3zM15 12.5a.5.5 0 0 0-1 0v-2h-2a.5.5 0 0 0 0-1h3a.5.5 0 0 0 .5-.5v3z" />
                            </svg>
                            Ambil Rekomendasi Area Ini
                        </>
                    )}
                </Button>
            </div>

            {/* BOTTOM NAVIGATION BAR */}
            <div
                className="bg-white d-flex justify-content-around py-3 shadow-lg"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    zIndex: 10,
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px'
                }}
            >
                <div className="text-center" style={{ color: '#0c2b4d', cursor: 'pointer' }}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                    </svg>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Peta</div>
                </div>

                <div
                    className="text-center position-relative"
                    style={{ color: pekerjaanDiambil.length > 0 ? '#e5b91b' : '#adb5bd', cursor: 'pointer' }}
                    onClick={() => setShowPekerjaanList(true)}
                >
                    {pekerjaanDiambil.length > 0 && (
                        <Badge
                            bg="danger"
                            className="position-absolute rounded-circle"
                            style={{ top: '-5px', right: '-5px', fontSize: '0.6rem' }}
                        >
                            {pekerjaanDiambil.length}
                        </Badge>
                    )}

                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-1z" />
                    </svg>

                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Pekerjaan</div>
                </div>

                <div
                    className="text-center position-relative"
                    style={{
                        color: riwayatNotifCount > 0 ? '#0d6efd' : '#adb5bd',
                        cursor: 'pointer'
                    }}
                    onClick={handleOpenRiwayat}
                >
                    {riwayatNotifCount > 0 && (
                        <Badge
                            bg="danger"
                            className="position-absolute rounded-circle"
                            style={{
                                top: '-7px',
                                right: '-8px',
                                fontSize: '0.6rem',
                                minWidth: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0'
                            }}
                        >
                            {riwayatNotifCount}
                        </Badge>
                    )}

                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
                        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
                        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
                    </svg>

                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                        Riwayat
                    </div>
                </div>

                <div className="text-center" onClick={handleLogout} style={{ color: '#dc3545', cursor: 'pointer' }}>
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                        <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                    </svg>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Keluar</div>
                </div>
            </div>

            {/* MODAL REKOMENDASI SPK */}
            <Modal show={showRekomendasi} onHide={() => setShowRekomendasi(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ color: '#0c2b4d', fontSize: '1.2rem' }}>
                        Tiket Area Pilihan
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-2">
                    <p className="text-muted small mb-3">
                        Rekomendasi tiket prioritas di sekitar area yang Anda tandai.
                    </p>

                    {spkData.length === 0 ? (
                        <div className="text-center p-3 text-muted">
                            Semua rekomendasi di area ini telah diambil.
                        </div>
                    ) : (
                        spkData.map((tiket, idx) => (
                            <div key={tiket.tiket_id || tiket.id} className="border p-3 mb-3 rounded-4 shadow-sm bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Badge
                                        bg={tiket.nomor_prioritas_asli === 1 ? 'danger' : 'warning'}
                                        className="rounded-pill px-3 py-1"
                                    >
                                        Prioritas #{tiket.nomor_prioritas_asli || idx + 1}
                                    </Badge>

                                    <span className="fw-bold text-success small">
                                        Skor SAW: {
                                            tiket.skor_saw !== undefined ? Number(tiket.skor_saw).toFixed(3)
                                                : tiket.skor !== undefined ? Number(tiket.skor).toFixed(3)
                                                    : tiket.score !== undefined ? Number(tiket.score).toFixed(3)
                                                        : '-'
                                        }
                                    </span>
                                </div>

                                <h6 className="fw-bold mb-1" style={{ color: '#0c2b4d' }}>
                                    {tiket.nama_pelanggan || tiket.aset?.pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                                </h6>

                                <p className="text-muted small mb-3 text-truncate">
                                    📍 {tiket.alamat_pelanggan || tiket.aset?.pelanggan?.alamat_pelanggan || 'Alamat tidak tersedia'}
                                </p>

                                <div className="d-flex justify-content-between mb-3 bg-light p-2 rounded-3 border" style={{ fontSize: '0.75rem' }}>
                                    <div className="text-truncate pe-2" style={{ maxWidth: '45%' }}>
                                        <span className="text-muted">Jarak: </span>
                                        <strong className="text-dark">
                                            {tiket.jarak_km ? Number(tiket.jarak_km).toFixed(2) : '-'} km
                                        </strong>
                                    </div>

                                    <div className="text-truncate text-end ps-2 border-start" style={{ maxWidth: '55%' }}>
                                        <span className="text-muted">No: </span>
                                        <strong className="text-dark">
                                            {tiket.nomor_tiket}
                                        </strong>
                                    </div>
                                </div>

                                <Button
                                    variant="outline-primary"
                                    className="w-100 fw-bold rounded-pill"
                                    style={{ borderColor: '#0c2b4d', color: '#0c2b4d' }}
                                    onClick={() => handleAmbilTiket(tiket)}
                                    disabled={ambilTiketLoadingId === (tiket.tiket_id || tiket.id)}
                                >
                                    {ambilTiketLoadingId === (tiket.tiket_id || tiket.id) ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Mengambil Tiket...
                                        </>
                                    ) : (
                                        'Ambil Tiket Ini'
                                    )}
                                </Button>
                            </div>
                        ))
                    )}
                </Modal.Body>
            </Modal>

            {/* DRAWER PEKERJAAN HARI INI */}
            <Offcanvas
                show={showPekerjaanList}
                onHide={() => setShowPekerjaanList(false)}
                placement="bottom"
                style={{ height: '70vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold" style={{ color: '#0c2b4d' }}>
                        Pekerjaan Hari Ini
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    {pekerjaanDiambil.length === 0 ? (
                        <div className="text-center text-muted mt-5">
                            Belum ada tiket yang diambil.
                        </div>
                    ) : (
                        pekerjaanDiambil.map((tiket) => (
                            <div
                                key={tiket.tiket_id || tiket.id}
                                className="border p-3 mb-3 rounded-4 shadow-sm"
                                style={{ backgroundColor: '#f4f7f9' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h6 className="fw-bold mb-0" style={{ color: '#0c2b4d' }}>
                                        {tiket.nama_pelanggan || tiket.aset?.pelanggan?.nama_pelanggan || 'Tidak Diketahui'}
                                    </h6>

                                    {tiket.status === 'dikerjakan' && (
                                        <Badge bg="warning" text="dark" className="rounded-pill" style={{ fontSize: '0.65rem' }}>
                                            Sedang Dikerjakan
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-muted small mb-3">
                                    📍 {tiket.alamat_pelanggan || tiket.aset?.pelanggan?.alamat_pelanggan || 'Informasi alamat tidak tersedia'}
                                </p>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="light"
                                        className="w-50 fw-bold rounded-pill border shadow-sm text-dark d-flex align-items-center justify-content-center"
                                        onClick={() => {
                                            const tikor =
                                                tiket.tikor ||
                                                tiket.tikor_baru ||
                                                tiket.aset?.tikor_baru ||
                                                tiket.aset?.tikor ||
                                                tiket.aset?.pelanggan?.tikor ||
                                                tiket.pelanggan?.tikor;

                                            if (tikor) {
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${tikor}`, '_blank');
                                            } else {
                                                setModalNotif({
                                                    show: true,
                                                    title: 'Koordinat Tidak Ditemukan',
                                                    message: 'Data tikor GPS belum tersedia untuk pelanggan ini.',
                                                    isSuccess: false
                                                });
                                            }
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-alt-fill me-2 text-danger" viewBox="0 0 16 16">
                                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                        </svg>
                                        Panduan Rute
                                    </Button>

                                    {tiket.status === 'dikerjakan' ? (
                                        <Button
                                            variant="warning"
                                            className="w-50 fw-bold rounded-pill shadow-sm border-0 text-dark"
                                            onClick={() => navigate(`/pekerjaan/${tiket.tiket_id || tiket.id}`)}
                                        >
                                            Lanjutkan Laporan
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            className="w-50 fw-bold rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-center"
                                            style={{ backgroundColor: '#0c2b4d' }}
                                            onClick={() => handleMulaiProses(tiket)}
                                            disabled={mulaiProsesLoadingId === (tiket.tiket_id || tiket.id)}
                                        >
                                            {mulaiProsesLoadingId === (tiket.tiket_id || tiket.id) ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Memulai...
                                                </>
                                            ) : (
                                                'Mulai Proses'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </Offcanvas.Body>
            </Offcanvas>

            {/* DRAWER RIWAYAT PEKERJAAN */}
            <Offcanvas
                show={showRiwayat}
                onHide={() => setShowRiwayat(false)}
                placement="bottom"
                style={{ height: '70vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold" style={{ color: '#0c2b4d' }}>
                        Riwayat Pekerjaan
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <p className="text-muted small mb-4">
                        Daftar pekerjaan APP TR yang telah selesai Anda kerjakan.
                    </p>

                    {loadingRiwayat && riwayatData.length === 0 ? (
                        <div className="text-center text-muted mt-5">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Memuat riwayat...
                        </div>
                    ) : riwayatData.length === 0 ? (
                        <div className="text-center text-muted mt-5">
                            Belum ada riwayat pekerjaan.
                        </div>
                    ) : (
                        riwayatData.map((item) => {
                            const status = item.status || item.tiket?.status;
                            const statusInfo = getStatusInfo(status);

                            const namaPelanggan =
                                item.aset?.pelanggan?.nama_pelanggan ||
                                item.tiket?.aset?.pelanggan?.nama_pelanggan ||
                                item.nama_pelanggan ||
                                'Tanpa Nama';

                            const alamatPelanggan =
                                item.aset?.pelanggan?.alamat_pelanggan ||
                                item.tiket?.aset?.pelanggan?.alamat_pelanggan ||
                                item.alamat_pelanggan ||
                                '-';

                            const tanggal =
                                item.updated_at?.substring(0, 10) ||
                                item.tanggal_tiket ||
                                item.pekerjaan?.tanggal ||
                                item.tanggal ||
                                '-';

                            return (
                                <div
                                    key={item.id}
                                    className={`border ${statusInfo.borderClass} p-3 mb-3 rounded-4 shadow-sm bg-white position-relative`}
                                >
                                    <div
                                        className="position-absolute"
                                        style={{ top: '15px', right: '15px', color: statusInfo.iconColor }}
                                    >
                                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                        </svg>
                                    </div>

                                    <h6 className="fw-bold mb-1" style={{ color: '#0c2b4d', paddingRight: '30px' }}>
                                        {namaPelanggan}
                                    </h6>

                                    <p className="text-muted small mb-2">
                                        📍 {alamatPelanggan}
                                    </p>

                                    <Badge
                                        bg={statusInfo.variant}
                                        text={status === 'inReview' ? 'dark' : undefined}
                                        className="rounded-pill px-3 py-1"
                                    >
                                        {statusInfo.label}
                                    </Badge>

                                    <span className="text-muted small ms-2">
                                        {tanggal}
                                    </span>
                                </div>
                            );
                        })
                    )}

                    {loadingRiwayat && riwayatData.length > 0 && (
                        <div className="text-center text-muted py-3">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Memuat riwayat...
                        </div>
                    )}

                    {!loadingRiwayat && riwayatMeta?.has_more && (
                        <Button
                            variant="light"
                            className="w-100 rounded-pill fw-bold border mt-2"
                            onClick={handleLoadMoreRiwayat}
                        >
                            Muat Lagi
                        </Button>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
}