import { useState } from 'react';
import {
    Alert,
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

export default function AdminImport() {
    const navigate = useNavigate();

    const [files, setFiles] = useState({
        pelanggan: null,
        aset: null,
        tiket: null,
    });

    const [uploadingKey, setUploadingKey] = useState(null);

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

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

            const formData = new FormData();
            formData.append('file', selectedFile);

            await api.post(item.endpoint, formData);
            
            setModalNotif({
                show: true,
                title: 'Import Berhasil',
                message: `${item.title} berhasil diproses.`,
                isSuccess: true,
            });

            setFiles((prev) => ({
                ...prev,
                [item.key]: null,
            }));
        } catch (error) {
            console.error(`Gagal import ${item.key}:`, error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Import Gagal',
                message: error.response?.data?.message || `${item.title} gagal diproses.`,
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
                            >
                                Dashboard
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                <Alert variant="warning" className="rounded-4 border-0 shadow-sm">
                    Pastikan urutan kolom Excel sesuai format import backend. Untuk data besar, import pelanggan dulu, lalu aset, lalu tiket.
                </Alert>

                <Row className="g-3">
                    {IMPORT_OPTIONS.map((item) => (
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
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(event) => handleFileChange(item.key, event)}
                                        />

                                        <div className="small text-muted mt-2">
                                            {files[item.key]?.name || 'Belum ada file dipilih'}
                                        </div>
                                    </Form.Group>

                                    <Button
                                        className="w-100 rounded-pill fw-bold"
                                        style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                        onClick={() => handleUpload(item)}
                                        disabled={uploadingKey === item.key}
                                    >
                                        {uploadingKey === item.key ? (
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
                    ))}
                </Row>
            </Container>
        </div>
    );
}
