import { useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Spinner,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PLN_BLUE = '#0c2b4d';
const PLN_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';

const IMPORT_OPTIONS = [
    {
        key: 'pelanggan',
        title: 'Import Pelanggan',
        endpoint: '/import/pelanggan',
        icon: '👥',
        description: 'Upload data pelanggan berisi IDPEL, nama, alamat, tarif, daya, unitup, dan tikor.',
    },
    {
        key: 'aset',
        title: 'Import Aset APP TR',
        endpoint: '/import/aset',
        icon: '⚙️',
        description: 'Upload data aset APP TR seperti nomor kWh, merek, tahun tera, faktor kali DIL, dan relasi pelanggan.',
    },
    {
        key: 'tiket',
        title: 'Import Tiket',
        endpoint: '/import/tiket',
        icon: '🎫',
        description: 'Upload data tiket pekerjaan yang terhubung dengan aset APP TR.',
    },
];

function NotificationModal({ modalNotif, onClose }) {
    return (
        <Modal show={modalNotif.show} onHide={onClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-3 fs-1">
                    {modalNotif.isSuccess ? '✅' : '❌'}
                </div>

                <h5 className="fw-bold mb-2">
                    {modalNotif.title}
                </h5>

                <p className="text-muted small mb-4">
                    {modalNotif.message}
                </p>

                <Button
                    variant={modalNotif.isSuccess ? 'success' : 'danger'}
                    className="w-100 rounded-pill fw-bold"
                    onClick={onClose}
                >
                    Mengerti
                </Button>
            </Modal.Body>
        </Modal>
    );
}

function ImportResult({ result }) {
    if (!result) return null;

    const gagal = Array.isArray(result.gagal) ? result.gagal : [];

    return (
        <Card className="border-0 shadow-sm rounded-4 mt-4">
            <Card.Body className="p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                    <div>
                        <h5 className="fw-bold mb-1" style={{ color: PLN_BLUE }}>
                            Hasil Import Terakhir
                        </h5>

                        <div className="small text-muted">
                            {result.message || 'Import selesai diproses.'}
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Badge bg="success" className="rounded-pill px-3 py-2">
                            Sukses: {result.sukses ?? 0}
                        </Badge>

                        <Badge bg={gagal.length > 0 ? 'danger' : 'secondary'} className="rounded-pill px-3 py-2">
                            Gagal: {gagal.length}
                        </Badge>
                    </div>
                </div>

                {gagal.length > 0 && (
                    <div className="bg-light rounded-4 p-3">
                        <div className="fw-bold small text-danger mb-2">
                            Beberapa baris gagal diproses:
                        </div>

                        <div style={{ maxHeight: 220, overflow: 'auto' }}>
                            {gagal.slice(0, 30).map((item, index) => (
                                <div key={index} className="small border-bottom py-2">
                                    <span className="fw-bold">Baris {item.baris || '-'}</span>
                                    {' — '}
                                    {item.alasan || 'Tidak diketahui'}

                                    {item.idpel && (
                                        <span className="text-muted"> | IDPEL: {item.idpel}</span>
                                    )}

                                    {item.nomor_kwh && (
                                        <span className="text-muted"> | kWh: {item.nomor_kwh}</span>
                                    )}
                                </div>
                            ))}

                            {gagal.length > 30 && (
                                <div className="small text-muted pt-2">
                                    Menampilkan 30 dari {gagal.length} data gagal.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default function AdminImport() {
    const navigate = useNavigate();

    const [files, setFiles] = useState({
        pelanggan: null,
        aset: null,
        tiket: null,
    });

    const [fileInputKey, setFileInputKey] = useState({
        pelanggan: 0,
        aset: 0,
        tiket: 0,
    });

    const [uploadingKey, setUploadingKey] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    const isUploading = Boolean(uploadingKey);

    const handleFileChange = (key, event) => {
        const file = event.target.files?.[0] || null;

        setFiles((prev) => ({
            ...prev,
            [key]: file,
        }));
    };

    const handleUpload = async (item) => {
        const selectedFile = files[item.key];

        if (!selectedFile) {
            setModalNotif({
                show: true,
                title: 'File Belum Dipilih',
                message: `Pilih file Excel untuk ${item.title} terlebih dahulu.`,
                isSuccess: false,
            });

            return;
        }

        try {
            setUploadingKey(item.key);
            setImportResult(null);

            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(item.endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000,
            });

            const result = response.data || {};

            setImportResult({
                jenis: item.title,
                message: result.message || `${item.title} berhasil diproses.`,
                sukses: result.sukses ?? 0,
                gagal: result.gagal || [],
            });

            setModalNotif({
                show: true,
                title: 'Import Selesai',
                message: `${item.title} selesai diproses. Sukses: ${result.sukses ?? 0}, Gagal: ${Array.isArray(result.gagal) ? result.gagal.length : 0}.`,
                isSuccess: true,
            });

            setFiles((prev) => ({
                ...prev,
                [item.key]: null,
            }));

            setFileInputKey((prev) => ({
                ...prev,
                [item.key]: prev[item.key] + 1,
            }));
        } catch (error) {
            console.error(`Gagal import ${item.key}:`, error.response?.data || error);

            const responseData = error.response?.data;
            const isTimeout =
                error.code === 'ECONNABORTED' ||
                String(error.message || '').toLowerCase().includes('timeout');

            setImportResult({
                jenis: item.title,
                message: responseData?.message || (isTimeout
                    ? 'Request import timeout. Jika sebagian data sudah masuk, import ulang file yang sama tidak akan menggandakan data.'
                    : `${item.title} gagal diproses.`),
                sukses: responseData?.sukses ?? 0,
                gagal: responseData?.gagal || [],
            });

            setModalNotif({
                show: true,
                title: isTimeout ? 'Import Timeout' : 'Import Gagal',
                message: responseData?.message || (isTimeout
                    ? 'Proses import terlalu lama. Coba import ulang file yang sama. Data tidak akan dobel jika backend sudah memakai updateOrCreate/upsert.'
                    : `${item.title} gagal diproses.`),
                isSuccess: false,
            });
        } finally {
            setUploadingKey(null);
        }
    };

    return (
        <div className="min-vh-100 bg-light py-3 py-lg-4">
            <NotificationModal
                modalNotif={modalNotif}
                onClose={() => setModalNotif((prev) => ({ ...prev, show: false }))}
            />

            <Container fluid="xl">
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <Card.Body className="text-white p-3 p-md-4 p-xl-5" style={{ backgroundColor: PLN_BLUE }}>
                        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm">
                                    <img
                                        src={PLN_LOGO_URL}
                                        alt="PLN"
                                        width="28"
                                        height="28"
                                        className="object-fit-contain"
                                    />
                                </div>

                                <div>
                                    <div className="fw-bold fs-5">
                                        Import Excel
                                    </div>

                                    <div className="text-white-50 small">
                                        Upload data pelanggan, aset APP TR, dan tiket pekerjaan.
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="light"
                                className="rounded-pill fw-bold px-3"
                                style={{ color: PLN_BLUE }}
                                onClick={() => navigate('/dashboard-admin')}
                                disabled={isUploading}
                            >
                                Dashboard
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                {isUploading ? (
                    <Alert variant="info" className="rounded-4 border-0 shadow-sm">
                        <div className="d-flex align-items-center gap-2 fw-bold mb-1">
                            <Spinner animation="border" size="sm" />
                            Import sedang diproses...
                        </div>

                        <div className="small">
                            Jangan tutup halaman dan jangan klik tombol import lain sampai proses selesai.
                            Untuk file besar, proses aset atau tiket bisa memakan waktu lebih lama.
                        </div>
                    </Alert>
                ) : (
                    <Alert variant="warning" className="rounded-4 border-0 shadow-sm">
                        Pastikan urutan import: <strong>pelanggan dulu</strong>, lalu <strong>aset</strong>, lalu <strong>tiket</strong>.
                        Jika import gagal karena timeout, file yang sama bisa diimport ulang tanpa membuat data dobel.
                    </Alert>
                )}

                <Row className="g-3">
                    {IMPORT_OPTIONS.map((item) => {
                        const isCurrentUploading = uploadingKey === item.key;

                        return (
                            <Col xs={12} lg={4} key={item.key}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4">
                                        <div className="fs-2 mb-2">
                                            {item.icon}
                                        </div>

                                        <h5 className="fw-bold mb-2" style={{ color: PLN_BLUE }}>
                                            {item.title}
                                        </h5>

                                        <p className="small text-muted mb-4">
                                            {item.description}
                                        </p>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">
                                                Pilih file Excel
                                            </Form.Label>

                                            <Form.Control
                                                key={fileInputKey[item.key]}
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(event) => handleFileChange(item.key, event)}
                                                disabled={isUploading}
                                            />

                                            <div className="small text-muted mt-2">
                                                {files[item.key]?.name || 'Belum ada file dipilih'}
                                            </div>
                                        </Form.Group>

                                        <Button
                                            className="w-100 rounded-pill fw-bold"
                                            style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                            onClick={() => handleUpload(item)}
                                            disabled={isUploading || !files[item.key]}
                                        >
                                            {isCurrentUploading ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    Mengimport...
                                                </>
                                            ) : (
                                                'Upload & Import'
                                            )}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                <ImportResult result={importResult} />
            </Container>
        </div>
    );
}