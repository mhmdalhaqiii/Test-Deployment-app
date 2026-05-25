import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    Modal,
    Row,
    Spinner,
    Table,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PLN_BLUE = '#0c2b4d';
const PLN_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';

const STATUS_OPTIONS = [
    { key: 'semua', label: 'Semua' },
    { key: 'tersedia', label: 'Tersedia' },
    { key: 'berjalan', label: 'Berjalan' },
    { key: 'dikerjakan', label: 'Dikerjakan' },
    { key: 'inReview', label: 'Review Admin' },
    { key: 'menungguValidasi', label: 'Validasi' },
    { key: 'selesai', label: 'Selesai' },
];

function getStatusInfo(status) {
    switch (status) {
        case 'tersedia':
            return { label: 'Tersedia', badge: 'secondary' };
        case 'berjalan':
            return { label: 'Berjalan', badge: 'dark' };
        case 'dikerjakan':
            return { label: 'Dikerjakan', badge: 'warning', text: 'dark' };
        case 'inReview':
            return { label: 'Review Admin', badge: 'primary' };
        case 'menungguValidasi':
            return { label: 'Validasi Manajer', badge: 'info', text: 'dark' };
        case 'selesai':
            return { label: 'Selesai', badge: 'success' };
        default:
            return { label: status || '-', badge: 'secondary' };
    }
}

function formatTanggal(value) {
    if (!value) return '-';

    try {
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function getAsetLabel(aset) {
    const pelanggan = aset?.pelanggan;

    const nama = pelanggan?.nama_pelanggan || 'Tanpa Nama';
    const idpel = pelanggan?.idpel || '-';
    const nomorKwh = aset?.nomor_kwh || '-';

    return `${nama} - IDPEL ${idpel} - Nomor kWh ${nomorKwh}`;
}

function generateNomorTiket(asetId, asetData, tiketData) {
    const asetTerpilih = asetData.find((aset) => String(aset.id) === String(asetId));
    const idpel = asetTerpilih?.pelanggan?.idpel;

    if (!idpel) return '';

    const prefix = `PKJ-${idpel}-`;

    const nomorUrutTerakhir = tiketData
        .filter((tiket) => tiket.nomor_tiket?.startsWith(prefix))
        .map((tiket) => {
            const nomorAkhir = tiket.nomor_tiket.replace(prefix, '');
            return Number(nomorAkhir);
        })
        .filter((nomor) => !Number.isNaN(nomor))
        .sort((a, b) => b - a)[0] || 0;

    return `${prefix}${nomorUrutTerakhir + 1}`;
}

function NotificationModal({ modalNotif, onClose }) {
    return (
        <Modal show={modalNotif.show} onHide={onClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-3 fs-1">
                    {modalNotif.isSuccess ? '✅' : '❌'}
                </div>

                <h5 className="fw-bold mb-2">{modalNotif.title}</h5>

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

export default function AdminTiket() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [tiketData, setTiketData] = useState([]);
    const [asetData, setAsetData] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [editData, setEditData] = useState(null);

    const [formData, setFormData] = useState({
        aset_id: '',
        nomor_tiket: '',
        tanggal_tiket: '',
        status: 'tersedia',
        tim_id: '',
    });

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const [tiketResponse, asetResponse] = await Promise.all([
                api.get('/admin/tiket'),
                api.get('/aset'),
            ]);

            const tiket = tiketResponse.data.data || tiketResponse.data || [];
            const aset = asetResponse.data.data || asetResponse.data || [];

            setTiketData(Array.isArray(tiket) ? tiket : []);
            setAsetData(Array.isArray(aset) ? aset : []);
        } catch (error) {
            console.error('Gagal memuat data tiket:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data tiket gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setEditData(null);
        setFormData({
            aset_id: '',
            nomor_tiket: '',
            tanggal_tiket: new Date().toISOString().slice(0, 10),
            status: 'tersedia',
            tim_id: '',
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditData(item);

        setFormData({
            aset_id: item.aset_id || '',
            nomor_tiket: item.nomor_tiket || '',
            tanggal_tiket: item.tanggal_tiket || '',
            status: item.status || 'tersedia',
            tim_id: item.tim_id || '',
        });

        setShowFormModal(true);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        if (name === 'aset_id' && !editData) {
            const nomorTiketBaru = generateNomorTiket(value, asetData, tiketData);

            setFormData((prev) => ({
                ...prev,
                aset_id: value,
                nomor_tiket: nomorTiketBaru,
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);

            const payload = {
                aset_id: formData.aset_id,
                nomor_tiket: formData.nomor_tiket,
                tanggal_tiket: formData.tanggal_tiket,
                status: formData.status,
                tim_id: formData.tim_id || null,
            };

            if (editData) {
                await api.put(`/admin/tiket/${editData.id}`, payload);
            } else {
                await api.post('/admin/tiket', payload);
            }

            setShowFormModal(false);

            setModalNotif({
                show: true,
                title: editData ? 'Tiket Diperbarui' : 'Tiket Ditambahkan',
                message: editData
                    ? 'Data tiket berhasil diperbarui.'
                    : 'Data tiket pekerjaan berhasil ditambahkan.',
                isSuccess: true,
            });

            await fetchData();
        } catch (error) {
            console.error('Gagal menyimpan tiket:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: error.response?.data?.message || 'Data tiket gagal disimpan.',
                isSuccess: false,
            });
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (item) => {
        setDeleteTarget(item);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleting(true);

            await api.delete(`/admin/tiket/${deleteTarget.id}`);

            setShowDeleteModal(false);
            setDeleteTarget(null);

            setModalNotif({
                show: true,
                title: 'Tiket Dihapus',
                message: 'Data tiket berhasil dihapus.',
                isSuccess: true,
            });

            await fetchData();
        } catch (error) {
            console.error('Gagal menghapus tiket:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menghapus',
                message: error.response?.data?.message || 'Tiket gagal dihapus.',
                isSuccess: false,
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredData = useMemo(() => {
        let result = [...tiketData];

        if (filterStatus !== 'semua') {
            result = result.filter((item) => item.status === filterStatus);
        }

        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
            result = result.filter((item) => {
                const pelanggan = item.aset?.pelanggan;

                const searchable = [
                    item.nomor_tiket,
                    item.status,
                    item.tanggal_tiket,
                    pelanggan?.nama_pelanggan,
                    pelanggan?.idpel,
                    pelanggan?.alamat_pelanggan,
                    item.aset?.nomor_kwh,
                    item.aset?.merek_kwh,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(keyword);
            });
        }

        return result.sort((a, b) => Number(a.id) - Number(b.id));
    }, [tiketData, filterStatus, searchTerm]);

    const statistik = useMemo(() => {
        const countByStatus = (status) =>
            tiketData.filter((item) => item.status === status).length;

        return {
            total: tiketData.length,
            tersedia: countByStatus('tersedia'),
            berjalan: countByStatus('berjalan'),
            dikerjakan: countByStatus('dikerjakan'),
            inReview: countByStatus('inReview'),
            menungguValidasi: countByStatus('menungguValidasi'),
            selesai: countByStatus('selesai'),
        };
    }, [tiketData]);

    return (
        <div className="min-vh-100 bg-light py-3 py-lg-4">
            <NotificationModal
                modalNotif={modalNotif}
                onClose={() => setModalNotif((prev) => ({ ...prev, show: false }))}
            />

            <Modal
                show={showDeleteModal}
                onHide={closeDeleteModal}
                centered
                size="sm"
            >
                <Modal.Body className="text-center p-4">
                    <div
                        className="mx-auto mb-3 rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                        style={{ width: 64, height: 64 }}
                    >
                        <span className="fs-2">🗑️</span>
                    </div>

                    <h5 className="fw-bold mb-2 text-danger">
                        Hapus Tiket?
                    </h5>

                    <p className="text-muted small mb-3">
                        Tiket ini akan dihapus dari database. Tindakan ini tidak bisa dibatalkan.
                    </p>

                    <div className="bg-light rounded-4 p-3 mb-4 text-start">
                        <div className="small text-muted fw-bold mb-1">
                            Nomor Tiket
                        </div>

                        <div className="fw-bold" style={{ color: PLN_BLUE }}>
                            {deleteTarget?.nomor_tiket || '-'}
                        </div>

                        <div className="small text-muted mt-2">
                            ID Tiket: {deleteTarget?.id || '-'}
                        </div>
                    </div>

                    <div className="d-grid gap-2">
                        <Button
                            variant="danger"
                            className="rounded-pill fw-bold"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Menghapus...
                                </>
                            ) : (
                                'Ya, Hapus Tiket'
                            )}
                        </Button>

                        <Button
                            variant="light"
                            className="rounded-pill fw-bold border"
                            onClick={closeDeleteModal}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal
                show={showFormModal}
                onHide={() => setShowFormModal(false)}
                centered
                size="lg"
            >
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold" style={{ color: PLN_BLUE }}>
                            {editData ? 'Edit Tiket Pekerjaan' : 'Tambah Tiket Pekerjaan'}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Aset / Pelanggan
                                    </Form.Label>

                                    <Form.Select
                                        name="aset_id"
                                        value={formData.aset_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Pilih aset pelanggan</option>
                                        {asetData.map((aset) => (
                                            <option key={aset.id} value={aset.id}>
                                                {getAsetLabel(aset)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Nomor Tiket
                                    </Form.Label>

                                    <Form.Control
                                        name="nomor_tiket"
                                        value={formData.nomor_tiket}
                                        onChange={handleChange}
                                        placeholder="Contoh: PKJ-141002657248-1"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tanggal Tiket
                                    </Form.Label>

                                    <Form.Control
                                        type="date"
                                        name="tanggal_tiket"
                                        value={formData.tanggal_tiket}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Status
                                    </Form.Label>

                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="tersedia">Tersedia</option>
                                        <option value="berjalan">Berjalan</option>
                                        <option value="dikerjakan">Dikerjakan</option>
                                        <option value="inReview">Review Admin</option>
                                        <option value="menungguValidasi">Validasi Manajer</option>
                                        <option value="selesai">Selesai</option>
                                    </Form.Select>

                                    <div className="small text-muted mt-1">
                                        Untuk tiket baru biasanya pilih <strong>tersedia</strong>.
                                    </div>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tim ID
                                    </Form.Label>

                                    <Form.Control
                                        name="tim_id"
                                        value={formData.tim_id}
                                        onChange={handleChange}
                                        placeholder="Opsional"
                                    />

                                    <div className="small text-muted mt-1">
                                        Boleh kosong. Nanti akan terisi saat pekerjaan diambil / diproses.
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="light"
                            className="rounded-pill fw-bold px-4 border"
                            onClick={() => setShowFormModal(false)}
                            disabled={saving}
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            className="rounded-pill fw-bold px-4"
                            style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Container fluid="xl">
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <Card.Body className="text-white p-3 p-md-4 p-xl-5" style={{ backgroundColor: PLN_BLUE }}>
                        <div className="d-flex justify-content-between align-items-start gap-3">
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
                                        Kelola Tiket Pekerjaan
                                    </div>

                                    <div className="text-white-50 small">
                                        Buat, edit, dan pantau tiket pekerjaan pemeliharaan APP TR.
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <Button
                                    variant="light"
                                    className="rounded-pill fw-bold px-3"
                                    style={{ color: PLN_BLUE }}
                                    onClick={() => navigate('/dashboard-admin')}
                                >
                                    Dashboard
                                </Button>

                                <Button
                                    variant="warning"
                                    className="rounded-pill fw-bold px-3"
                                    onClick={openCreateModal}
                                >
                                    + Tambah Tiket
                                </Button>
                            </div>
                        </div>

                        <Row className="g-3 mt-4">
                            <Col xs={6} md={3} xl>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.total}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} xl>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Tersedia</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.tersedia}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} xl>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Dikerjakan</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.dikerjakan}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} xl>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Review</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.inReview}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} xl>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Selesai</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.selesai}</div>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-3 p-md-4">
                        <Row className="g-3 align-items-center">
                            <Col xs={12} lg={5}>
                                <h5 className="fw-bold mb-1" style={{ color: PLN_BLUE }}>
                                    Daftar Tiket
                                </h5>
                                <div className="small text-muted">
                                    Filter dan cari tiket berdasarkan pelanggan, IDPEL, nomor tiket, atau status.
                                </div>
                            </Col>

                            <Col xs={12} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0 rounded-start-pill">
                                        🔎
                                    </InputGroup.Text>

                                    <Form.Control
                                        className="bg-light border-0 rounded-end-pill"
                                        placeholder="Cari nomor tiket, pelanggan, IDPEL..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs={12} lg={2}>
                                <Button
                                    variant="outline-secondary"
                                    className="w-100 rounded-pill fw-bold"
                                    onClick={fetchData}
                                    disabled={loading}
                                >
                                    {loading ? 'Memuat...' : 'Refresh'}
                                </Button>
                            </Col>
                        </Row>

                        <div className="d-flex gap-2 overflow-auto pt-3 mt-3 border-top">
                            {STATUS_OPTIONS.map((status) => (
                                <Button
                                    key={status.key}
                                    size="sm"
                                    className="rounded-pill fw-bold px-3 flex-shrink-0"
                                    variant={filterStatus === status.key ? 'primary' : 'light'}
                                    style={
                                        filterStatus === status.key
                                            ? { backgroundColor: PLN_BLUE, border: 'none' }
                                            : { border: '1px solid #dee2e6' }
                                    }
                                    onClick={() => setFilterStatus(status.key)}
                                >
                                    {status.label}
                                </Button>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" style={{ color: PLN_BLUE }} />
                                <div className="small text-muted mt-2">
                                    Memuat data tiket...
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="fs-1 text-muted">—</div>
                                <div className="fw-bold text-muted">
                                    Tidak ada tiket ditemukan.
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Tiket</th>
                                            <th>Pelanggan</th>
                                            <th>IDPEL</th>
                                            <th>Aset</th>
                                            <th>Tanggal</th>
                                            <th>Status</th>
                                            <th className="text-end pe-4">Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredData.map((item) => {
                                            const pelanggan = item.aset?.pelanggan;
                                            const statusInfo = getStatusInfo(item.status);

                                            return (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold" style={{ color: PLN_BLUE }}>
                                                            {item.nomor_tiket || '-'}
                                                        </div>
                                                        <div className="small text-muted">
                                                            ID #{item.id}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="fw-semibold">
                                                            {pelanggan?.nama_pelanggan || '-'}
                                                        </div>
                                                        <div className="small text-muted text-truncate" style={{ maxWidth: 260 }}>
                                                            {pelanggan?.alamat_pelanggan || '-'}
                                                        </div>
                                                    </td>

                                                    <td className="fw-semibold">
                                                        {pelanggan?.idpel || '-'}
                                                    </td>

                                                    <td>
                                                        <div className="small">
                                                            Nomor kWh: <span className="fw-bold">{item.aset?.nomor_kwh || '-'}</span>
                                                        </div>
                                                        <div className="small text-muted">
                                                            {item.aset?.merek_kwh || '-'} • {item.aset?.thtera_kwh || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {formatTanggal(item.tanggal_tiket)}
                                                    </td>

                                                    <td>
                                                        <Badge
                                                            bg={statusInfo.badge}
                                                            text={statusInfo.text}
                                                            className="rounded-pill px-3 py-2"
                                                        >
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </td>

                                                    <td className="text-end pe-4">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                className="rounded-pill fw-bold"
                                                                style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                                                                onClick={() => openEditModal(item)}
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                className="rounded-pill fw-bold"
                                                                onClick={() => openDeleteModal(item)}
                                                            >
                                                                Hapus
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}