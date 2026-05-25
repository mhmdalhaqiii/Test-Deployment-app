import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Badge, Modal, Form } from 'react-bootstrap';
import api from '../services/api';

export default function FormFotoPekerjaan() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tiketData, setTiketData] = useState(null);
    const [pekerjaanId, setPekerjaanId] = useState(null);

    const [fotoData, setFotoData] = useState({});
    const [selectedFiles, setSelectedFiles] = useState({});
    const [fotoUploading, setFotoUploading] = useState({});
    const [fotoStatus, setFotoStatus] = useState({});

    const [bulkUploading, setBulkUploading] = useState(false);
    const [reviewSending, setReviewSending] = useState(false);

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true
    });

    const fotoGroups = [
        {
            title: 'Foto Arus Primer',
            items: [
                { field: 'foto_arus_primer_r', label: 'Foto Arus Primer R' },
                { field: 'foto_arus_primer_s', label: 'Foto Arus Primer S' },
                { field: 'foto_arus_primer_t', label: 'Foto Arus Primer T' },
            ]
        },
        {
            title: 'Foto Tegangan Primer',
            items: [
                { field: 'foto_tegangan_primer_r', label: 'Foto Tegangan Primer R' },
                { field: 'foto_tegangan_primer_s', label: 'Foto Tegangan Primer S' },
                { field: 'foto_tegangan_primer_t', label: 'Foto Tegangan Primer T' },
            ]
        },
        {
            title: 'Foto Arus Sekunder Ukur',
            items: [
                { field: 'foto_arus_sekunder_r_ukur', label: 'Foto Arus Sekunder Ukur R' },
                { field: 'foto_arus_sekunder_s_ukur', label: 'Foto Arus Sekunder Ukur S' },
                { field: 'foto_arus_sekunder_t_ukur', label: 'Foto Arus Sekunder Ukur T' },
            ]
        },
        {
            title: 'Foto Arus Sekunder Meter',
            items: [
                { field: 'foto_arus_sekunder_r_meter', label: 'Foto Arus Sekunder Meter R' },
                { field: 'foto_arus_sekunder_s_meter', label: 'Foto Arus Sekunder Meter S' },
                { field: 'foto_arus_sekunder_t_meter', label: 'Foto Arus Sekunder Meter T' },
            ]
        },
        {
            title: 'Foto Tegangan kWh Meter',
            items: [
                { field: 'foto_tegangan_kwh_r', label: 'Foto Tegangan kWh R' },
                { field: 'foto_tegangan_kwh_s', label: 'Foto Tegangan kWh S' },
                { field: 'foto_tegangan_kwh_t', label: 'Foto Tegangan kWh T' },
            ]
        },
    ];

    const allFotoFields = fotoGroups.flatMap(group =>
        group.items.map(item => item.field)
    );

    const pendingUploadCount = Object.keys(selectedFiles).filter(
        field => Boolean(selectedFiles[field])
    ).length;

    const uploadedCount = allFotoFields.filter(
        field => Boolean(fotoData?.[field])
    ).length;

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
                setPekerjaanId(pekerjaan.id);

                if (pekerjaan.foto) {
                    setFotoData(pekerjaan.foto);
                }
            }
        } catch (error) {
            console.error('Gagal memuat data foto pekerjaan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: 'Data pekerjaan tidak berhasil dimuat. Coba periksa koneksi atau login ulang.',
                isSuccess: false
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadSingleFoto = async (field, file) => {
        if (!file) return null;

        if (!pekerjaanId) {
            throw new Error('Data pekerjaan belum ditemukan. Simpan laporan terlebih dahulu.');
        }

        setFotoUploading(prev => ({
            ...prev,
            [field]: true
        }));

        setFotoStatus(prev => ({
            ...prev,
            [field]: 'uploading'
        }));

        try {
            const formUpload = new FormData();
            formUpload.append('pekerjaan_id', pekerjaanId);
            formUpload.append('field', field);
            formUpload.append('file', file);

            const response = await api.post('/foto-pekerjaan/upload', formUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFotoData(prev => ({
                ...prev,
                [field]: response.data.file_id
            }));

            setSelectedFiles(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });

            setFotoStatus(prev => ({
                ...prev,
                [field]: 'success'
            }));

            return response.data;
        } catch (error) {
            setFotoStatus(prev => ({
                ...prev,
                [field]: 'error'
            }));

            throw error;
        } finally {
            setFotoUploading(prev => ({
                ...prev,
                [field]: false
            }));
        }
    };

    const handleUploadSemuaFoto = async (showModal = true) => {
        const entries = Object.entries(selectedFiles).filter(([_, file]) => Boolean(file));

        if (!pekerjaanId) {
            setModalNotif({
                show: true,
                title: 'Laporan Belum Tersimpan',
                message: 'Simpan laporan pekerjaan terlebih dahulu sebelum upload foto.',
                isSuccess: false
            });
            return false;
        }

        if (entries.length === 0) {
            if (showModal) {
                setModalNotif({
                    show: true,
                    title: 'Tidak Ada Foto Baru',
                    message: 'Belum ada foto baru yang dipilih untuk diupload.',
                    isSuccess: false
                });
            }
            return true;
        }

        try {
            setBulkUploading(true);

            for (const [field, file] of entries) {
                await uploadSingleFoto(field, file);
            }

            setSelectedFiles({});

            if (showModal) {
                setModalNotif({
                    show: true,
                    title: 'Upload Selesai',
                    message: 'Semua foto yang dipilih berhasil diupload ke Google Drive.',
                    isSuccess: true
                });
            }

            return true;
        } catch (error) {
            console.error('Gagal upload semua foto:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Upload Foto',
                message: error.response?.data?.message || error.message || 'Ada foto yang gagal diupload.',
                isSuccess: false
            });

            return false;
        } finally {
            setBulkUploading(false);
        }
    };

    const handleKirimReview = async () => {
        if (!pekerjaanId) {
            setModalNotif({
                show: true,
                title: 'Data Pekerjaan Tidak Ada',
                message: 'Pekerjaan belum tersimpan. Kembali ke form laporan lalu klik Simpan Laporan.',
                isSuccess: false
            });
            return;
        }

        try {
            setReviewSending(true);

            // Kalau masih ada foto yang sudah dipilih tapi belum diupload,
            // upload dulu otomatis sebelum kirim ke admin.
            if (pendingUploadCount > 0) {
                const uploadOk = await handleUploadSemuaFoto(false);

                if (!uploadOk) {
                    return;
                }
            }

            await api.post(`/pekerjaan/${pekerjaanId}/kirim-review`);

            setModalNotif({
                show: true,
                title: 'Laporan Dikirim',
                message: 'Laporan berhasil dikirim ke admin untuk review.',
                isSuccess: true
            });

            setTimeout(() => {
                navigate('/dashboard-petugas');
            }, 1800);

        } catch (error) {
            console.error('Gagal kirim review:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Kirim Review',
                message: error.response?.data?.message || 'Gagal mengirim laporan ke admin.',
                isSuccess: false
            });
        } finally {
            setReviewSending(false);
        }
    };

    const FotoUploadBox = ({ field, label }) => {
        const sudahUpload = Boolean(fotoData?.[field]);
        const adaPending = Boolean(selectedFiles?.[field]);
        const sedangUpload = Boolean(fotoUploading?.[field]);

        return (
            <Card className="border-0 shadow-sm rounded-3 mb-3">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <div className="fw-bold small" style={{ color: '#0c2b4d' }}>
                                {label}
                            </div>

                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {adaPending
                                    ? selectedFiles[field]?.name
                                    : sudahUpload
                                        ? 'Foto sudah tersimpan'
                                        : 'Belum ada foto'}
                            </div>
                        </div>

                        <Badge
                            bg={adaPending ? 'warning' : sudahUpload ? 'success' : 'secondary'}
                            text={adaPending ? 'dark' : undefined}
                            className="rounded-pill"
                        >
                            {adaPending ? 'Siap Upload' : sudahUpload ? 'Uploaded' : 'Kosong'}
                        </Badge>
                    </div>

                    <Form.Control
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={sedangUpload || reviewSending || bulkUploading}
                        onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (!file) return;

                            setSelectedFiles(prev => ({
                                ...prev,
                                [field]: file
                            }));

                            setFotoStatus(prev => ({
                                ...prev,
                                [field]: 'pending'
                            }));
                        }}
                        className="shadow-sm border-0 rounded-3"
                    />

                    {(fotoStatus[field] || sudahUpload) && (
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="small d-flex align-items-center gap-2">
                                {fotoStatus[field] === 'uploading' && (
                                    <>
                                        <Spinner animation="border" size="sm" />
                                        <span className="text-primary fw-bold">
                                            Mengupload foto...
                                        </span>
                                    </>
                                )}

                                {fotoStatus[field] === 'pending' && (
                                    <span className="text-warning fw-bold">
                                        Foto siap diupload
                                    </span>
                                )}

                                {fotoStatus[field] === 'success' && (
                                    <span className="text-success fw-bold">
                                        Foto berhasil tersimpan
                                    </span>
                                )}

                                {fotoStatus[field] === 'error' && (
                                    <span className="text-danger fw-bold">
                                        Gagal upload foto
                                    </span>
                                )}

                                {!fotoStatus[field] && sudahUpload && (
                                    <span className="text-success fw-bold">
                                        Foto sudah tersimpan
                                    </span>
                                )}
                            </div>

                            {fotoStatus[field] === 'pending' && (
                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    className="rounded-pill"
                                    disabled={reviewSending || bulkUploading}
                                    onClick={() => {
                                        setSelectedFiles(prev => {
                                            const next = { ...prev };
                                            delete next[field];
                                            return next;
                                        });

                                        setFotoStatus(prev => {
                                            const next = { ...prev };
                                            delete next[field];
                                            return next;
                                        });
                                    }}
                                >
                                    Batal
                                </Button>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100dvh' }}>
                <Spinner animation="border" style={{ color: '#0c2b4d' }} />
            </Container>
        );
    }

    return (
        <Container className="py-4" style={{ maxWidth: '800px', paddingBottom: '220px' }}>

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
                        variant={modalNotif.isSuccess ? 'success' : 'danger'}
                        className="w-100 rounded-pill"
                        onClick={() => setModalNotif({ ...modalNotif, show: false })}
                    >
                        Mengerti
                    </Button>
                </Modal.Body>
            </Modal>

            <div className="d-flex align-items-center mb-4 gap-3">
                <Button
                    variant="white"
                    className="rounded-circle shadow-sm border"
                    onClick={() => navigate(`/pekerjaan/${id}`)}
                    style={{ width: '45px', height: '45px' }}
                    disabled={reviewSending || bulkUploading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#0c2b4d" className="bi bi-arrow-left" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                    </svg>
                </Button>

                <div>
                    <h4 className="fw-bold mb-0" style={{ color: '#0c2b4d' }}>Upload Foto Pekerjaan</h4>
                    <span className="text-muted small fw-bold">
                        NO: {tiketData?.nomor_tiket || '-'}
                    </span>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#f4f7f9' }}>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0 text-dark">
                            {tiketData?.nama_pelanggan || tiketData?.aset?.pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                        </h5>

                        <Badge bg="primary" className="rounded-pill px-3 py-2 shadow-sm" style={{ backgroundColor: '#2196f3' }}>
                            IDPEL: {tiketData?.idpel || tiketData?.aset?.pelanggan?.idpel || '-'}
                        </Badge>
                    </div>

                    <p className="text-muted small mb-0">
                        {tiketData?.alamat_pelanggan || tiketData?.aset?.pelanggan?.alamat_pelanggan || 'Alamat tidak tersedia'}
                    </p>
                </Card.Body>
            </Card>

            {!pekerjaanId && (
                <Alert variant="warning" className="rounded-4 shadow-sm">
                    Data pekerjaan belum ditemukan. Kembali ke form laporan, lalu klik <strong>Simpan Laporan</strong> terlebih dahulu.
                </Alert>
            )}

            <Alert variant="info" className="small rounded-4 shadow-sm">
                Foto boleh tidak lengkap. Pilih foto yang ada, lalu tekan <strong>Upload Semua</strong>. Setelah itu tekan <strong>Simpan Laporan</strong> untuk mengirim ke admin.
            </Alert>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                        <div className="fw-bold" style={{ color: '#0c2b4d' }}>
                            Ringkasan Foto
                        </div>
                        <div className="text-muted small">
                            Terupload: {uploadedCount} / {allFotoFields.length}
                        </div>
                    </div>

                    <Badge bg={pendingUploadCount > 0 ? 'warning' : 'success'} text={pendingUploadCount > 0 ? 'dark' : undefined}>
                        {pendingUploadCount > 0 ? `${pendingUploadCount} siap upload` : 'Tidak ada pending'}
                    </Badge>
                </Card.Body>
            </Card>

            {fotoGroups.map((group) => (
                <div key={group.title}>
                    <h6 className="fw-bold text-secondary mb-3 mt-4 border-bottom pb-2">
                        {group.title}
                    </h6>

                    {group.items.map((item) => (
                        <FotoUploadBox
                            key={item.field}
                            field={item.field}
                            label={item.label}
                        />
                    ))}
                </div>
            ))}

            <div style={{ height: '130px' }} />

            <div
                className="position-fixed bottom-0 start-0 end-0 bg-white p-3 shadow-lg d-flex justify-content-between align-items-center gap-2"
                style={{
                    zIndex: 100,
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
                }}
            >
                <Button
                    variant="outline-secondary"
                    className="fw-bold rounded-pill px-3"
                    onClick={() => navigate(`/pekerjaan/${id}`)}
                    disabled={reviewSending || bulkUploading}
                >
                    Kembali
                </Button>

                <Button
                    variant="warning"
                    className="fw-bold rounded-pill px-3 shadow-sm"
                    onClick={() => handleUploadSemuaFoto(true)}
                    disabled={reviewSending || bulkUploading || pendingUploadCount === 0 || !pekerjaanId}
                >
                    {bulkUploading ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Upload...
                        </>
                    ) : (
                        `Upload Semua${pendingUploadCount > 0 ? ` (${pendingUploadCount})` : ''}`
                    )}
                </Button>

                <Button
                    variant="primary"
                    className="fw-bold rounded-pill px-4 shadow-sm flex-grow-1"
                    style={{ backgroundColor: '#0c2b4d', border: 'none' }}
                    onClick={handleKirimReview}
                    disabled={reviewSending || bulkUploading || !pekerjaanId}
                >
                    {reviewSending ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Mengirim...
                        </>
                    ) : (
                        'Simpan Laporan'
                    )}
                </Button>
            </div>
        </Container>
    );
}