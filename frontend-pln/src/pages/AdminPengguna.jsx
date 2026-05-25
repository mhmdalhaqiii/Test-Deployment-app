import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

function getRoleInfo(role) {
    switch (role) {
        case 'admin':
            return { label: 'Admin', badge: 'primary' };

        case 'manajer':
            return { label: 'Manajer', badge: 'info', text: 'dark' };

        case 'petugas':
            return { label: 'Petugas', badge: 'warning', text: 'dark' };

        default:
            return { label: role || '-', badge: 'secondary' };
    }
}

export default function AdminPengguna() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [penggunaData, setPenggunaData] = useState([]);
    const [timOptions, setTimOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editData, setEditData] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'petugas',
        nama_petugas: '',
        nama_tim: '',
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

            const response = await api.get('/admin/pengguna');

            setPenggunaData(Array.isArray(response.data.data) ? response.data.data : []);
            setTimOptions(Array.isArray(response.data.tim_options) ? response.data.tim_options : []);
        } catch (error) {
            console.error('Gagal memuat pengguna:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data pengguna gagal dimuat.',
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
            name: '',
            email: '',
            password: '',
            role: 'petugas',
            nama_petugas: '',
            nama_tim: '',
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditData(item);

        setFormData({
            name: item.name || '',
            email: item.email || '',
            password: '',
            role: item.role || 'petugas',
            nama_petugas: item.petugas?.nama_petugas || '',
            nama_tim: item.petugas?.tim?.nama_tim || '',
        });

        setShowFormModal(true);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!editData && !formData.password) {
            setModalNotif({
                show: true,
                title: 'Password Wajib',
                message: 'Password wajib diisi saat menambah pengguna baru.',
                isSuccess: false,
            });
            return;
        }

        if (formData.role === 'petugas' && (!formData.nama_petugas || !formData.nama_tim)) {
            setModalNotif({
                show: true,
                title: 'Data Petugas Belum Lengkap',
                message: 'Nama petugas dan tim wajib diisi untuk role petugas.',
                isSuccess: false,
            });
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                nama_petugas: formData.role === 'petugas' ? formData.nama_petugas : null,
                nama_tim: formData.role === 'petugas' ? formData.nama_tim : null,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (editData) {
                await api.put(`/admin/pengguna/${editData.id}`, payload);
            } else {
                await api.post('/admin/pengguna', payload);
            }

            setShowFormModal(false);

            setModalNotif({
                show: true,
                title: editData ? 'Pengguna Diperbarui' : 'Pengguna Ditambahkan',
                message: editData
                    ? 'Data pengguna berhasil diperbarui.'
                    : 'Data pengguna berhasil ditambahkan.',
                isSuccess: true,
            });

            await fetchData();
        } catch (error) {
            console.error('Gagal menyimpan pengguna:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: error.response?.data?.message || 'Data pengguna gagal disimpan.',
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

            await api.delete(`/admin/pengguna/${deleteTarget.id}`);

            setShowDeleteModal(false);
            setDeleteTarget(null);

            setModalNotif({
                show: true,
                title: 'Pengguna Dihapus',
                message: 'Data pengguna berhasil dihapus.',
                isSuccess: true,
            });

            await fetchData();
        } catch (error) {
            console.error('Gagal menghapus pengguna:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menghapus',
                message: error.response?.data?.message || 'Pengguna gagal dihapus.',
                isSuccess: false,
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredData = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        let result = [...penggunaData];

        if (keyword) {
            result = result.filter((item) => {
                const searchable = [
                    item.id,
                    item.name,
                    item.email,
                    item.role,
                    item.petugas?.nama_petugas,
                    item.petugas?.tim?.nama_tim,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(keyword);
            });
        }

        return result.sort((a, b) => Number(a.id) - Number(b.id));
    }, [penggunaData, searchTerm]);

    const statistik = useMemo(() => {
        return {
            total: penggunaData.length,
            admin: penggunaData.filter((item) => item.role === 'admin').length,
            manajer: penggunaData.filter((item) => item.role === 'manajer').length,
            petugas: penggunaData.filter((item) => item.role === 'petugas').length,
        };
    }, [penggunaData]);

    return (
        <div className="min-vh-100 bg-light py-3 py-lg-4">
            <NotificationModal
                modalNotif={modalNotif}
                onClose={() => setModalNotif((prev) => ({ ...prev, show: false }))}
            />

            <Modal show={showDeleteModal} onHide={closeDeleteModal} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div
                        className="mx-auto mb-3 rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                        style={{ width: 64, height: 64 }}
                    >
                        <span className="fs-2">🗑️</span>
                    </div>

                    <h5 className="fw-bold mb-2 text-danger">
                        Hapus Pengguna?
                    </h5>

                    <p className="text-muted small mb-3">
                        Akun ini akan dihapus dari sistem. Tindakan ini tidak bisa dibatalkan.
                    </p>

                    <div className="bg-light rounded-4 p-3 mb-4 text-start">
                        <div className="small text-muted fw-bold mb-1">
                            Nama Akun
                        </div>

                        <div className="fw-bold" style={{ color: PLN_BLUE }}>
                            {deleteTarget?.name || '-'}
                        </div>

                        <div className="small text-muted mt-2">
                            Email: {deleteTarget?.email || '-'}
                        </div>

                        <div className="small text-muted mt-1">
                            Role: {deleteTarget?.role || '-'}
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
                                'Ya, Hapus Pengguna'
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

            <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold" style={{ color: PLN_BLUE }}>
                            {editData ? 'Edit Pengguna' : 'Tambah Pengguna'}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Nama Akun
                                    </Form.Label>

                                    <Form.Control
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Contoh: Admin UP3"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Email
                                    </Form.Label>

                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Password {editData ? 'Baru' : ''}
                                    </Form.Label>

                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={editData ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter'}
                                        required={!editData}
                                    />

                                    {editData && (
                                        <div className="small text-muted mt-1">
                                            Kosongkan jika password tidak ingin diganti.
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Role
                                    </Form.Label>

                                    <Form.Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manajer">Manajer</option>
                                        <option value="petugas">Petugas</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {formData.role === 'petugas' && (
                                <>
                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold">
                                                Nama Petugas
                                            </Form.Label>

                                            <Form.Control
                                                name="nama_petugas"
                                                value={formData.nama_petugas}
                                                onChange={handleChange}
                                                placeholder="Nama petugas lapangan"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col xs={12} md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-semibold">
                                                Tim
                                            </Form.Label>

                                            <Form.Control
                                                list="tim-options"
                                                name="nama_tim"
                                                value={formData.nama_tim}
                                                onChange={handleChange}
                                                placeholder="Contoh: Tim 1"
                                                required
                                            />

                                            <datalist id="tim-options">
                                                {timOptions.map((tim) => (
                                                    <option key={tim.id} value={tim.nama_tim} />
                                                ))}
                                            </datalist>

                                            <div className="small text-muted mt-1">
                                                Bisa pilih tim lama atau ketik nama tim baru.
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </>
                            )}
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
                                        Kelola Pengguna
                                    </div>

                                    <div className="text-white-50 small">
                                        Kelola akun admin, manajer, petugas, dan pembagian tim.
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
                                    + Tambah Pengguna
                                </Button>
                            </div>
                        </div>

                        <Row className="g-3 mt-4">
                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.total}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Admin</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.admin}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Manajer</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.manajer}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Petugas</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.petugas}</div>
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
                                    Daftar Pengguna
                                </h5>

                                <div className="small text-muted">
                                    Cari berdasarkan nama, email, role, petugas, atau tim.
                                </div>
                            </Col>

                            <Col xs={12} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0 rounded-start-pill">
                                        🔎
                                    </InputGroup.Text>

                                    <Form.Control
                                        className="bg-light border-0 rounded-end-pill"
                                        placeholder="Cari nama, email, role, tim..."
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
                    </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" style={{ color: PLN_BLUE }} />

                                <div className="small text-muted mt-2">
                                    Memuat data pengguna...
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="fs-1 text-muted">—</div>

                                <div className="fw-bold text-muted">
                                    Tidak ada pengguna ditemukan.
                                </div>
                            </div>
                        ) : (
                            <div
                                className="table-responsive"
                                style={{
                                    maxHeight: '68vh',
                                    overflow: 'auto',
                                    borderRadius: 16,
                                }}
                            >
                                <Table
                                    hover
                                    className="align-middle mb-0"
                                    style={{
                                        minWidth: 1050,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    <thead
                                        className="table-light"
                                        style={{
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 2,
                                        }}
                                    >
                                        <tr>
                                            <th className="ps-4" style={{ width: 70 }}>
                                                ID
                                            </th>

                                            <th style={{ width: 220 }}>
                                                Nama
                                            </th>

                                            <th style={{ width: 260 }}>
                                                Email
                                            </th>

                                            <th style={{ width: 120 }}>
                                                Role
                                            </th>

                                            <th style={{ width: 200 }}>
                                                Petugas
                                            </th>

                                            <th style={{ width: 160 }}>
                                                Tim
                                            </th>

                                            <th
                                                className="text-end pe-4 bg-light"
                                                style={{
                                                    width: 150,
                                                    position: 'sticky',
                                                    right: 0,
                                                    zIndex: 3,
                                                    boxShadow: '-8px 0 14px rgba(15, 23, 42, 0.06)',
                                                }}
                                            >
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredData.map((item) => {
                                            const roleInfo = getRoleInfo(item.role);

                                            return (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <Badge bg="light" text="dark" className="rounded-pill">
                                                            #{item.id}
                                                        </Badge>
                                                    </td>

                                                    <td>
                                                        <div className="fw-semibold">
                                                            {item.name || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="small text-muted text-truncate"
                                                            title={item.email || '-'}
                                                            style={{ maxWidth: 250 }}
                                                        >
                                                            {item.email || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <Badge
                                                            bg={roleInfo.badge}
                                                            text={roleInfo.text}
                                                            className="rounded-pill px-3 py-2"
                                                        >
                                                            {roleInfo.label}
                                                        </Badge>
                                                    </td>

                                                    <td>
                                                        {item.petugas?.nama_petugas || '-'}
                                                    </td>

                                                    <td>
                                                        <Badge bg="secondary" className="rounded-pill">
                                                            {item.petugas?.tim?.nama_tim || '-'}
                                                        </Badge>
                                                    </td>

                                                    <td
                                                        className="text-end pe-4 bg-white"
                                                        style={{
                                                            position: 'sticky',
                                                            right: 0,
                                                            zIndex: 1,
                                                            boxShadow: '-8px 0 14px rgba(15, 23, 42, 0.04)',
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline-primary"
                                                                className="rounded-pill fw-bold px-3"
                                                                style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                                                                onClick={() => openEditModal(item)}
                                                            >
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                className="rounded-pill fw-bold px-3"
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