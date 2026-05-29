import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Badge, Accordion, Modal, Form, Row, Col } from 'react-bootstrap';
import api from '../services/api';

export default function FormPekerjaan() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tiketData, setTiketData] = useState(null);

    const [gpsLoading, setGpsLoading] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [finalSaving, setFinalSaving] = useState(false);
    const [batalLoading, setBatalLoading] = useState(false);

    const isProcessing = gpsLoading || draftSaving || finalSaving || batalLoading;


    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true
    });

    const [showConfirmBatal, setShowConfirmBatal] = useState(false);

    const [formData, setFormData] = useState({
        pemadaman: 'tidak padam',
        konstruksi_app: 'non kubikel',
        faktor_kali_dil: '',
        faktor_kali_real: '',

        arus_primer_r_ukur: '',
        arus_primer_s_ukur: '',
        arus_primer_t_ukur: '',

        tegangan_primer_r_ukur: '',
        tegangan_primer_s_ukur: '',
        tegangan_primer_t_ukur: '',

        cos_phi_primer: '',
        p_primer_r: '',
        p_primer_s: '',
        p_primer_t: '',
        p_primer_total: '',

        arus_sekunder_r_ukur: '',
        arus_sekunder_s_ukur: '',
        arus_sekunder_t_ukur: '',

        arus_sekunder_r_meter: '',
        arus_sekunder_s_meter: '',
        arus_sekunder_t_meter: '',

        tegangan_meter_r: '',
        tegangan_meter_s: '',
        tegangan_meter_t: '',

        cos_phi_sekunder: '',

        merk_box: '',
        no_seri_box: '',
        tahun_box: '',
        kondisi_box_segel_kwh: '',
        catatan: '',
        tikor_baru: '',
        keterangan: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    useEffect(() => {
        fetchDetailTiket();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDetailTiket = async () => {
        try {
            const response = await api.get(`/tiket/${id}`);
            const data = response.data.data || response.data;

            setTiketData(data);

            const pekerjaan = Array.isArray(data.pekerjaan)
                ? data.pekerjaan[0]
                : data.pekerjaan;

            if (pekerjaan) {
                setFormData(prevState => {
                    const updatedForm = { ...prevState };

                    Object.keys(updatedForm).forEach((key) => {
                        if (pekerjaan[key] !== null && pekerjaan[key] !== undefined) {
                            updatedForm[key] = pekerjaan[key];
                        }
                    });

                    return updatedForm;
                });
            }

        } catch (error) {
            console.error("Gagal memuat detail tiket", error);
        } finally {
            setLoading(false);
        }
    };

    const n = (val) => parseFloat(val) || 0;

    const safeDiv = (num, den) => {
        const pembagi = n(den);
        if (pembagi === 0) return 0;
        return n(num) / pembagi;
    };

    // ====================================================================
    // HITUNGAN OTOMATIS
    // ====================================================================

    // 1. P Primer Total
    const p_primer_total =
        n(formData.p_primer_r) +
        n(formData.p_primer_s) +
        n(formData.p_primer_t);

    // 2. P Meter R/S/T/Total
    const p_meter_r =
        (n(formData.arus_sekunder_r_meter) *
            n(formData.tegangan_meter_r) *
            n(formData.cos_phi_sekunder)) / 1000;

    const p_meter_s =
        (n(formData.arus_sekunder_s_meter) *
            n(formData.tegangan_meter_s) *
            n(formData.cos_phi_sekunder)) / 1000;

    const p_meter_t =
        (n(formData.arus_sekunder_t_meter) *
            n(formData.tegangan_meter_t) *
            n(formData.cos_phi_sekunder)) / 1000;

    const p_meter_total = p_meter_r + p_meter_s + p_meter_t;

    // 3. Error kWh R/S/T/Total
    const error_kwh_r = safeDiv(
        (p_meter_r * n(formData.faktor_kali_dil)) - n(formData.p_primer_r),
        n(formData.p_primer_r)
    );

    const error_kwh_s = safeDiv(
        (p_meter_s * n(formData.faktor_kali_dil)) - n(formData.p_primer_s),
        n(formData.p_primer_s)
    );

    const error_kwh_t = safeDiv(
        (p_meter_t * n(formData.faktor_kali_dil)) - n(formData.p_primer_t),
        n(formData.p_primer_t)
    );

    const error_kwh_total = safeDiv(
        (p_meter_total * n(formData.faktor_kali_dil)) - p_primer_total,
        p_primer_total
    );

    // 4. Error CT R/S/T
    const error_ct_r = safeDiv(
        (n(formData.arus_sekunder_r_ukur) * n(formData.faktor_kali_dil)) - n(formData.arus_primer_r_ukur),
        n(formData.arus_primer_r_ukur)
    );

    const error_ct_s = safeDiv(
        (n(formData.arus_sekunder_s_ukur) * n(formData.faktor_kali_dil)) - n(formData.arus_primer_s_ukur),
        n(formData.arus_primer_s_ukur)
    );

    const error_ct_t = safeDiv(
        (n(formData.arus_sekunder_t_ukur) * n(formData.faktor_kali_dil)) - n(formData.arus_primer_t_ukur),
        n(formData.arus_primer_t_ukur)
    );

    // 5. Error CT Total sesuai aplikasi lama
    const arusSekunderMeterTotal =
        n(formData.arus_sekunder_r_meter) +
        n(formData.arus_sekunder_s_meter) +
        n(formData.arus_sekunder_t_meter);

    const arusPrimerTotal =
        n(formData.arus_primer_r_ukur) +
        n(formData.arus_primer_s_ukur) +
        n(formData.arus_primer_t_ukur);

    const faktorKaliReal =
        n(formData.faktor_kali_real) || n(formData.faktor_kali_dil);

    const error_ct_total = safeDiv(
        (arusSekunderMeterTotal * faktorKaliReal) - arusPrimerTotal,
        arusPrimerTotal
    );

    // 6. Catatan CT sesuai aplikasi lama
    const catatan_ct =
        n(formData.faktor_kali_real) !== 0 &&
            n(formData.faktor_kali_dil) !== 0 &&
            n(formData.faktor_kali_real) !== n(formData.faktor_kali_dil)
            ? 'CEK CT'
            : 'NORMAL';

    // 7. Rekomendasi sesuai aplikasi lama
    let rekomendasi = 'NORMAL';

    if (error_ct_total > 0.02 && error_kwh_total > 0.02) {
        rekomendasi = 'GANTI METER DAN CT';
    } else if (error_kwh_total > 0.02 && error_ct_total <= 0.02) {
        rekomendasi = 'GANTI METER';
    } else if (error_kwh_total <= 0.02 && error_ct_total > 0.02) {
        rekomendasi = 'GANTI CT';
    }

    const buildPayload = () => {

        const now = new Date();
        const tanggalStr =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0');

        const jamStr =
            String(now.getHours()).padStart(2, '0') + ":" +
            String(now.getMinutes()).padStart(2, '0');

        const payload = {
            ...formData,

            p_primer_total,

            p_meter_r,
            p_meter_s,
            p_meter_t,
            p_meter_total,

            error_kwh_r,
            error_kwh_s,
            error_kwh_t,
            error_kwh_total,

            error_ct_r,
            error_ct_s,
            error_ct_t,
            error_ct_total,

            catatan_ct,
            rekomendasi,

            tiket_id: id,
            tanggal: tanggalStr,
            jam: jamStr
        };

        Object.keys(payload).forEach(key => {
            if (payload[key] === "") {
                payload[key] = null;
            }
        });

        return payload;
    };

    const handleAmbilLokasi = () => {
        if (!navigator.geolocation) {
            setModalNotif({
                show: true,
                title: 'GPS Tidak Didukung',
                message: 'Browser atau perangkat ini tidak mendukung fitur lokasi GPS.',
                isSuccess: false
            });
            return;
        }

        setGpsLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude.toFixed(6);
                const longitude = position.coords.longitude.toFixed(6);
                const koordinat = `${latitude}, ${longitude}`;

                setFormData(prevState => ({
                    ...prevState,
                    tikor_baru: koordinat
                }));

                setGpsLoading(false);

                setModalNotif({
                    show: true,
                    title: 'Lokasi Berhasil Diambil',
                    message: `Koordinat petugas berhasil diambil: ${koordinat}`,
                    isSuccess: true
                });
            },
            (error) => {
                let pesanError = 'Gagal mengambil lokasi. Pastikan GPS aktif dan izin lokasi diberikan.';

                if (error.code === error.PERMISSION_DENIED) {
                    pesanError = 'Izin lokasi ditolak. Silakan izinkan akses lokasi pada browser.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    pesanError = 'Lokasi tidak tersedia. Pastikan GPS perangkat aktif.';
                } else if (error.code === error.TIMEOUT) {
                    pesanError = 'Pengambilan lokasi terlalu lama. Coba ulangi lagi.';
                }

                setGpsLoading(false);

                setModalNotif({
                    show: true,
                    title: 'Gagal Mengambil Lokasi',
                    message: pesanError,
                    isSuccess: false
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    };

    const saveDraftAndReturnPekerjaan = async (showSuccessModal = true) => {
        const payload = buildPayload();

        console.log("📝 PAYLOAD DRAFT:", payload);

        await api.post(`/pekerjaan/draft`, payload);

        if (showSuccessModal) {
            setModalNotif({
                show: true,
                title: 'Draft Tersimpan',
                message: 'Data sementara berhasil disimpan di database.',
                isSuccess: true
            });
        }
    };

    const handleSimpanDraft = async () => {
        try {
            setDraftSaving(true);

            await saveDraftAndReturnPekerjaan(true);

        } catch (error) {
            console.error("Gagal simpan draft:", error.response?.data || error);

            const errorMessage = error.response?.data?.message || 'Gagal menyimpan draft. Cek koneksi atau console.';

            setModalNotif({
                show: true,
                title: 'Gagal Simpan Draft',
                message: errorMessage,
                isSuccess: false
            });
        } finally {
            setDraftSaving(false);
        }
    };


    const executeBatalPekerjaan = async () => {
        if (batalLoading) return;

        try {
            setBatalLoading(true);

            await api.post(`/tiket/${id}/batal`);

            setShowConfirmBatal(false);

            setModalNotif({
                show: true,
                title: 'Dibatalkan',
                message: 'Pekerjaan dibatalkan, status tiket kembali menjadi Berjalan.',
                isSuccess: true
            });

            setTimeout(() => {
                navigate('/dashboard-petugas');
            }, 900);

        } catch (error) {
            console.error("Gagal membatalkan tiket", error);

            setBatalLoading(false);

            setModalNotif({
                show: true,
                title: 'Error',
                message: 'Gagal membatalkan tiket. Coba periksa kembali jaringan Anda.',
                isSuccess: false
            });
        }
    };

    const handleSimpanLaporan = async () => {
        if (finalSaving) return;

        try {
            setFinalSaving(true);

            const payload = buildPayload();

            console.log("🚀 PAYLOAD FINAL:", payload);

            await api.post(`/pekerjaan`, payload);

            setModalNotif({
                show: true,
                title: 'Simpan Sukses!',
                message: 'Laporan berhasil disimpan. Silakan lanjut upload foto.',
                isSuccess: true
            });

            setTimeout(() => {
                navigate(`/pekerjaan/${id}/foto`);
            }, 900);

        } catch (error) {
            console.error("Gagal menyimpan:", error.response?.data || error);

            setFinalSaving(false);

            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengirim data laporan. Cek console.';

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: errorMessage,
                isSuccess: false
            });
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" style={{ color: '#0c2b4d' }} />
            </Container>
        );
    }

    if (!tiketData) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger" className="rounded-4">Data tiket tidak ditemukan.</Alert>
                <Button variant="outline-secondary" className="rounded-pill" onClick={() => navigate(-1)}>
                    Kembali
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4" style={{ maxWidth: '800px', paddingBottom: '130px' }}>

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

            <Modal show={showConfirmBatal} onHide={() => setShowConfirmBatal(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#ffc107" className="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                        </svg>
                    </div>

                    <h5 className="fw-bold mb-2">Batalkan Pekerjaan?</h5>
                    <p className="text-muted small mb-4">Status tiket ini akan dikembalikan menjadi 'Berjalan'.</p>

                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            className="w-50 rounded-pill fw-bold"
                            onClick={() => setShowConfirmBatal(false)}
                            disabled={batalLoading}
                        >
                            Tidak
                        </Button>

                        <Button
                            variant="danger"
                            className="w-50 rounded-pill fw-bold d-flex align-items-center justify-content-center"
                            onClick={executeBatalPekerjaan}
                            disabled={batalLoading}
                        >
                            {batalLoading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Membatalkan...
                                </>
                            ) : (
                                'Ya, Batal'
                            )}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="d-flex align-items-center mb-4 gap-3">
                <Button
                    variant="white"
                    className="rounded-circle shadow-sm border"
                    onClick={() => navigate('/dashboard-petugas')}
                    style={{ width: '45px', height: '45px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#0c2b4d" className="bi bi-arrow-left" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                    </svg>
                </Button>

                <div>
                    <h4 className="fw-bold mb-0" style={{ color: '#0c2b4d' }}>Laporan Pekerjaan</h4>
                    <span className="text-muted small fw-bold">NO: {tiketData.nomor_tiket}</span>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#f4f7f9' }}>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0 text-dark">
                            {tiketData.nama_pelanggan || tiketData.aset?.pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                        </h5>

                        <Badge bg="primary" className="rounded-pill px-3 py-2 shadow-sm" style={{ backgroundColor: '#2196f3' }}>
                            IDPEL: {tiketData.idpel || tiketData.aset?.pelanggan?.idpel || '-'}
                        </Badge>
                    </div>

                    <p className="text-muted small mb-0 d-flex align-items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#dc3545" className="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                        </svg>
                        {tiketData.alamat_pelanggan || tiketData.aset?.pelanggan?.alamat_pelanggan || 'Alamat tidak tersedia'}
                    </p>
                </Card.Body>
            </Card>

            <Accordion
                defaultActiveKey="0"
                className="shadow-sm rounded-4 mb-4"
                style={{ overflow: 'hidden', border: '1px solid #e9ecef' }}
            >
                <Accordion.Item eventKey="0" className="border-0 border-bottom">
                    <Accordion.Header>
                        <strong style={{ color: '#0c2b4d' }}>1. Info Umum & Sisi Primer</strong>
                    </Accordion.Header>

                    <Accordion.Body className="bg-light p-4">

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">Informasi Umum APP</h6>

                        <Row className="mb-3">
                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Pemadaman</Form.Label>
                                    <Form.Select
                                        name="pemadaman"
                                        value={formData.pemadaman}
                                        onChange={handleChange}
                                        className="shadow-sm border-0 rounded-3"
                                    >
                                        <option value="tidak padam">Tidak Padam</option>
                                        <option value="padam">Padam</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Konstruksi</Form.Label>
                                    <Form.Select
                                        name="konstruksi_app"
                                        value={formData.konstruksi_app}
                                        onChange={handleChange}
                                        className="shadow-sm border-0 rounded-3"
                                    >
                                        <option value="non kubikel">Non Kubikel</option>
                                        <option value="kubikel">Kubikel</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-4">
                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Faktor Kali DIL</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="faktor_kali_dil"
                                        value={formData.faktor_kali_dil}
                                        onChange={handleChange}
                                        placeholder="Contoh: 40"
                                        className="shadow-sm border-0 rounded-3"
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Faktor Kali Real</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="faktor_kali_real"
                                        value={formData.faktor_kali_real}
                                        onChange={handleChange}
                                        placeholder="Contoh: 40"
                                        className="shadow-sm border-0 rounded-3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">Hasil Ukur Sisi Primer</h6>

                        <Form.Label className="small fw-bold text-muted">Arus Primer Ukur (A)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="arus_primer_r_ukur" value={formData.arus_primer_r_ukur} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_primer_s_ukur" value={formData.arus_primer_s_ukur} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_primer_t_ukur" value={formData.arus_primer_t_ukur} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                        <Form.Label className="small fw-bold text-muted">Tegangan Primer Ukur (V)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="tegangan_primer_r_ukur" value={formData.tegangan_primer_r_ukur} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="tegangan_primer_s_ukur" value={formData.tegangan_primer_s_ukur} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="tegangan_primer_t_ukur" value={formData.tegangan_primer_t_ukur} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Cos Phi Primer</Form.Label>
                            <Form.Control
                                type="number"
                                name="cos_phi_primer"
                                value={formData.cos_phi_primer}
                                onChange={handleChange}
                                placeholder="Contoh: 0.98"
                                className="shadow-sm border-0 rounded-3"
                            />
                        </Form.Group>

                        <Form.Label className="small fw-bold text-muted">P Primer Ukur (kW)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="p_primer_r" value={formData.p_primer_r} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="p_primer_s" value={formData.p_primer_s} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="p_primer_t" value={formData.p_primer_t} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1" className="border-0 border-bottom">
                    <Accordion.Header>
                        <strong style={{ color: '#0c2b4d' }}>2. Sisi Sekunder & Meter</strong>
                    </Accordion.Header>

                    <Accordion.Body className="bg-light p-4">

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">Hasil Ukur Sisi Sekunder</h6>

                        <Form.Label className="small fw-bold text-muted">Arus Sekunder Ukur (A)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_r_ukur" value={formData.arus_sekunder_r_ukur} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_s_ukur" value={formData.arus_sekunder_s_ukur} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_t_ukur" value={formData.arus_sekunder_t_ukur} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                        <h6 className="fw-bold text-secondary mb-3 mt-4 border-bottom pb-2">Pembacaan Meter</h6>

                        <Form.Label className="small fw-bold text-muted">Arus Sekunder Meter (A)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_r_meter" value={formData.arus_sekunder_r_meter} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_s_meter" value={formData.arus_sekunder_s_meter} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="arus_sekunder_t_meter" value={formData.arus_sekunder_t_meter} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                        <Form.Label className="small fw-bold text-muted">Tegangan Meter (V)</Form.Label>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Control type="number" name="tegangan_meter_r" value={formData.tegangan_meter_r} onChange={handleChange} placeholder="R" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="tegangan_meter_s" value={formData.tegangan_meter_s} onChange={handleChange} placeholder="S" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                            <Col>
                                <Form.Control type="number" name="tegangan_meter_t" value={formData.tegangan_meter_t} onChange={handleChange} placeholder="T" className="shadow-sm border-0 rounded-3 text-center" />
                            </Col>
                        </Row>

                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">Cos Phi Sekunder</Form.Label>
                            <Form.Control
                                type="number"
                                name="cos_phi_sekunder"
                                value={formData.cos_phi_sekunder}
                                onChange={handleChange}
                                placeholder="Contoh: 0.98"
                                className="shadow-sm border-0 rounded-3"
                            />
                        </Form.Group>

                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2" className="border-0 border-bottom">
                    <Accordion.Header>
                        <strong style={{ color: '#198754' }}>3. Hasil Analisa Otomatis</strong>
                    </Accordion.Header>

                    <Accordion.Body className="bg-light p-4">
                        <Alert variant="success" className="p-2 text-center small fw-bold mb-4 rounded-3">
                            Semua nilai di bawah ini dihitung otomatis berdasarkan rumus aplikasi.
                        </Alert>

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">P Primer</h6>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">P Primer Total</Form.Label>
                            <Form.Control type="text" value={`${p_primer_total.toFixed(3)} kW`} readOnly className="shadow-sm border-0 rounded-3 bg-white fw-bold" />
                        </Form.Group>

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">P Meter Otomatis (kW)</h6>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Label className="small fw-bold text-muted">R</Form.Label>
                                <Form.Control type="text" value={p_meter_r.toFixed(3)} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">S</Form.Label>
                                <Form.Control type="text" value={p_meter_s.toFixed(3)} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">T</Form.Label>
                                <Form.Control type="text" value={p_meter_t.toFixed(3)} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold" />
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">P Meter Total</Form.Label>
                            <Form.Control type="text" value={`${p_meter_total.toFixed(3)}`} readOnly className="shadow-sm border-0 rounded-3 bg-white fw-bold" />
                        </Form.Group>

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">Error kWh Meter Otomatis (%)</h6>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Label className="small fw-bold text-muted">R</Form.Label>
                                <Form.Control type="text" value={`${(error_kwh_r * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">S</Form.Label>
                                <Form.Control type="text" value={`${(error_kwh_s * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">T</Form.Label>
                                <Form.Control type="text" value={`${(error_kwh_t * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">Error kWh Total</Form.Label>
                            <Form.Control type="text" value={`${(error_kwh_total * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 bg-white fw-bold text-danger" />
                        </Form.Group>

                        <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">Error CT Otomatis (%)</h6>
                        <Row className="mb-3 g-2">
                            <Col>
                                <Form.Label className="small fw-bold text-muted">R</Form.Label>
                                <Form.Control type="text" value={`${(error_ct_r * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">S</Form.Label>
                                <Form.Control type="text" value={`${(error_ct_s * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                            <Col>
                                <Form.Label className="small fw-bold text-muted">T</Form.Label>
                                <Form.Control type="text" value={`${(error_ct_t * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 text-center bg-white fw-bold text-danger" />
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">Error CT Total</Form.Label>
                            <Form.Control type="text" value={`${(error_ct_total * 100).toFixed(2)} %`} readOnly className="shadow-sm border-0 rounded-3 bg-white fw-bold text-danger" />
                        </Form.Group>

                        <Card className="border-0 bg-white shadow-sm rounded-3 p-3">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="small fw-bold text-muted">Catatan CT</span>
                                <Badge bg={catatan_ct === 'NORMAL' ? 'success' : 'warning'} text={catatan_ct === 'NORMAL' ? undefined : 'dark'}>
                                    {catatan_ct}
                                </Badge>
                            </div>

                            <div className="d-flex justify-content-between mt-2">
                                <span className="small fw-bold text-muted">Rekomendasi</span>
                                <Badge bg={rekomendasi === 'NORMAL' ? 'success' : 'danger'}>
                                    {rekomendasi}
                                </Badge>
                            </div>
                        </Card>
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3" className="border-0">
                    <Accordion.Header>
                        <strong style={{ color: '#0c2b4d' }}>4. Pemeriksaan Fisik & Catatan</strong>
                    </Accordion.Header>

                    <Accordion.Body className="bg-light p-4">

                        <Row className="mb-3">
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Merek Box APP</Form.Label>
                                    <Form.Control type="text" name="merk_box" value={formData.merk_box} onChange={handleChange} placeholder="Masukkan merek box" className="shadow-sm border-0 rounded-3" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3 g-2">
                            <Col xs={8}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">No. Seri Box</Form.Label>
                                    <Form.Control type="text" name="no_seri_box" value={formData.no_seri_box} onChange={handleChange} placeholder="No Seri" className="shadow-sm border-0 rounded-3" />
                                </Form.Group>
                            </Col>

                            <Col xs={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Tahun</Form.Label>
                                    <Form.Control type="number" name="tahun_box" value={formData.tahun_box} onChange={handleChange} placeholder="YYYY" className="shadow-sm border-0 rounded-3" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Kondisi Box & Segel kWh</Form.Label>
                            <Form.Control type="text" name="kondisi_box_segel_kwh" value={formData.kondisi_box_segel_kwh} onChange={handleChange} placeholder="Contoh: Baik / Segel Putus" className="shadow-sm border-0 rounded-3" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Titik Koordinat Baru (Opsional)</Form.Label>

                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    name="tikor_baru"
                                    value={formData.tikor_baru}
                                    onChange={handleChange}
                                    placeholder="Contoh: -2.9909, 104.7566"
                                    className="shadow-sm border-0 rounded-3"
                                />

                                <Button
                                    type="button"
                                    variant="success"
                                    className="rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center"
                                    style={{ minWidth: '130px' }}
                                    onClick={handleAmbilLokasi}
                                    disabled={isProcessing}
                                >
                                    {gpsLoading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            GPS
                                        </>
                                    ) : (
                                        'Lokasi'
                                    )}
                                </Button>
                            </div>

                            <Form.Text className="text-muted small">
                                Tekan tombol Lokasi untuk mengambil titik GPS perangkat petugas secara otomatis.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Catatan Petugas</Form.Label>
                            <Form.Control as="textarea" rows={3} name="catatan" value={formData.catatan} onChange={handleChange} placeholder="Masukkan catatan tambahan jika ada..." className="shadow-sm border-0 rounded-3" />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">Keterangan Khusus</Form.Label>
                            <Form.Control as="textarea" rows={2} name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Keterangan lain-lain..." className="shadow-sm border-0 rounded-3" />
                        </Form.Group>

                    </Accordion.Body>
                </Accordion.Item>

            </Accordion>

            <div className="position-fixed bottom-0 start-0 end-0 bg-white p-3 shadow-lg d-flex justify-content-between align-items-center gap-2" style={{ zIndex: 100, borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>

                <Button
                    variant="outline-danger"
                    className="fw-bold rounded-pill px-3"
                    onClick={() => setShowConfirmBatal(true)}
                    disabled={isProcessing}
                >
                    Batal
                </Button>

                <Button
                    variant="warning"
                    className="fw-bold rounded-pill px-3 shadow-sm"
                    onClick={handleSimpanDraft}
                    disabled={isProcessing}
                >
                    {draftSaving ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Menyimpan
                        </>
                    ) : (
                        'Simpan Draft'
                    )}
                </Button>

                <Button
                    variant="primary"
                    className="fw-bold rounded-pill px-4 shadow-sm"
                    style={{ backgroundColor: '#0c2b4d', border: 'none' }}
                    onClick={handleSimpanLaporan}
                    disabled={isProcessing}
                >
                    {finalSaving ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Menyimpan...
                        </>
                    ) : (
                        'Simpan Laporan'
                    )}
                </Button>
            </div>

        </Container>
    );
}