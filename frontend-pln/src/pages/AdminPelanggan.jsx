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

export default function AdminPelanggan() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [pelangganData, setPelangganData] = useState([]);
    const [meta, setMeta] = useState(null);

    const [statistik, setStatistik] = useState({
        total_pelanggan: 0,
        total_filter: 0,
    });

    const [filterOptions, setFilterOptions] = useState({
        tarif_options: [],
        unitup_options: [],
    });

    const [searchTerm, setSearchTerm] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editData, setEditData] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        idpel: '',
        unitup: '',
        nama_pelanggan: '',
        alamat_pelanggan: '',
        tarif: '',
        daya: '',
        tikor: '',
    });

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);

            const response = await api.get('/pelanggan', {
                params: {
                    search: searchTerm,
                    page,
                    per_page: 10,
                },
            });

            const data = response.data.data || [];

            setPelangganData(Array.isArray(data) ? data : []);
            setMeta(response.data.meta || null);

            setStatistik(response.data.statistik || {
                total_pelanggan: 0,
                total_filter: 0,
            });

            setFilterOptions(response.data.filters || {
                tarif_options: [],
                unitup_options: [],
            });
        } catch (error) {
            console.error('Gagal memuat pelanggan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data pelanggan gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [fetchData]);

    const resetForm = () => {
        setEditData(null);

        setFormData({
            idpel: '',
            unitup: '',
            nama_pelanggan: '',
            alamat_pelanggan: '',
            tarif: '',
            daya: '',
            tikor: '',
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditData(item);

        setFormData({
            idpel: item.idpel || '',
            unitup: item.unitup || '',
            nama_pelanggan: item.nama_pelanggan || '',
            alamat_pelanggan: item.alamat_pelanggan || '',
            tarif: item.tarif || '',
            daya: item.daya || '',
            tikor: item.tikor || '',
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

        try {
            setSaving(true);

            const payload = {
                idpel: formData.idpel,
                unitup: formData.unitup,
                nama_pelanggan: formData.nama_pelanggan,
                alamat_pelanggan: formData.alamat_pelanggan,
                tarif: formData.tarif,
                daya: formData.daya,
                tikor: formData.tikor,
            };

            if (editData) {
                await api.put(`/pelanggan/${editData.id}`, payload);
            } else {
                await api.post('/pelanggan', payload);
            }

            setShowFormModal(false);

            setModalNotif({
                show: true,
                title: editData ? 'Pelanggan Diperbarui' : 'Pelanggan Ditambahkan',
                message: editData
                    ? 'Data pelanggan berhasil diperbarui.'
                    : 'Data pelanggan berhasil ditambahkan.',
                isSuccess: true,
            });

            await fetchData(meta?.current_page || 1);
        } catch (error) {
            console.error('Gagal menyimpan pelanggan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: error.response?.data?.message || 'Data pelanggan gagal disimpan.',
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

            await api.delete(`/pelanggan/${deleteTarget.id}`);

            setShowDeleteModal(false);
            setDeleteTarget(null);

            setModalNotif({
                show: true,
                title: 'Pelanggan Dihapus',
                message: 'Data pelanggan berhasil dihapus.',
                isSuccess: true,
            });

            await fetchData(meta?.current_page || 1);
        } catch (error) {
            console.error('Gagal menghapus pelanggan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menghapus',
                message: error.response?.data?.message || 'Data pelanggan gagal dihapus. Pastikan pelanggan tidak sedang dipakai oleh aset.',
                isSuccess: false,
            });
        } finally {
            setDeleting(false);
        }
    };

    const filteredData = pelangganData;

    const totalPelanggan =
        statistik.total_pelanggan ?? meta?.total ?? filteredData.length;

    const totalFilter =
        statistik.total_filter ?? meta?.total ?? filteredData.length;

    const jumlahDitampilkan = filteredData.length;

    const tarifOptions = useMemo(() => {
        const defaultTarif = [
            'R1', 'R2', 'R3',
            'B1', 'B2', 'B3',
            'I1', 'I2', 'I3', 'I4',
            'P1', 'P2', 'P3',
            'S1', 'S2', 'S3',
        ];

        return [...new Set([...(filterOptions.tarif_options || []), ...defaultTarif])]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
    }, [filterOptions.tarif_options]);

    const unitupOptions = useMemo(() => {
        const defaultUnitup = [
            '14100',
            '14110',
            '14120',
            '14130',
            '14220',
            '14230',
            '14240',
        ];

        return [...new Set([...(filterOptions.unitup_options || []), ...defaultUnitup])]
            .filter(Boolean)
            .sort((a, b) => Number(a) - Number(b));
    }, [filterOptions.unitup_options]);

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
                        Hapus Pelanggan?
                    </h5>

                    <p className="text-muted small mb-3">
                        Data pelanggan ini akan dihapus. Tindakan ini tidak bisa dibatalkan.
                    </p>

                    <div className="bg-light rounded-4 p-3 mb-4 text-start">
                        <div className="small text-muted fw-bold mb-1">
                            Nama Pelanggan
                        </div>

                        <div className="fw-bold" style={{ color: PLN_BLUE }}>
                            {deleteTarget?.nama_pelanggan || '-'}
                        </div>

                        <div className="small text-muted mt-2">
                            IDPEL: {deleteTarget?.idpel || '-'}
                        </div>

                        <div className="small text-muted mt-1">
                            Unitup: {deleteTarget?.unitup || '-'}
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
                                'Ya, Hapus Pelanggan'
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
                            {editData ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        IDPEL
                                    </Form.Label>

                                    <Form.Control
                                        name="idpel"
                                        value={formData.idpel}
                                        onChange={handleChange}
                                        placeholder="Contoh: 141002657248"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Unitup
                                    </Form.Label>

                                    <Form.Select
                                        name="unitup"
                                        value={formData.unitup}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Pilih Unitup</option>

                                        {unitupOptions.map((unitup) => (
                                            <option key={unitup} value={unitup}>
                                                {unitup}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Nama Pelanggan
                                    </Form.Label>

                                    <Form.Control
                                        name="nama_pelanggan"
                                        value={formData.nama_pelanggan}
                                        onChange={handleChange}
                                        placeholder="Nama pelanggan"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tarif
                                    </Form.Label>

                                    <Form.Select
                                        name="tarif"
                                        value={formData.tarif}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Pilih tarif</option>

                                        {tarifOptions.map((tarif) => (
                                            <option key={tarif} value={tarif}>
                                                {tarif}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Daya
                                    </Form.Label>

                                    <Form.Control
                                        name="daya"
                                        value={formData.daya}
                                        onChange={handleChange}
                                        placeholder="Contoh: 41500"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tikor
                                    </Form.Label>

                                    <Form.Control
                                        name="tikor"
                                        value={formData.tikor}
                                        onChange={handleChange}
                                        placeholder="Contoh: -2.964745, 104.744898"
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Alamat Pelanggan
                                    </Form.Label>

                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="alamat_pelanggan"
                                        value={formData.alamat_pelanggan}
                                        onChange={handleChange}
                                        placeholder="Alamat lengkap pelanggan"
                                        required
                                    />
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
                                        Kelola Pelanggan
                                    </div>

                                    <div className="text-white-50 small">
                                        Tambah, edit, dan kelola data pelanggan APP TR.
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
                                    + Tambah Pelanggan
                                </Button>
                            </div>
                        </div>

                        <Row className="g-3 mt-4">
                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total Pelanggan</div>
                                    <div className="display-6 fw-bold mb-0">{totalPelanggan}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Hasil Pencarian</div>
                                    <div className="display-6 fw-bold mb-0">{totalFilter}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Ditampilkan</div>
                                    <div className="display-6 fw-bold mb-0">{jumlahDitampilkan}</div>
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
                                    Daftar Pelanggan
                                </h5>

                                <div className="small text-muted">
                                    Cari berdasarkan IDPEL, Unitup, nama pelanggan, alamat, tarif, daya, atau tikor.
                                </div>
                            </Col>

                            <Col xs={12} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0 rounded-start-pill">
                                        🔎
                                    </InputGroup.Text>

                                    <Form.Control
                                        className="bg-light border-0 rounded-end-pill"
                                        placeholder="Cari IDPEL, Unitup, nama, alamat..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs={12} lg={2}>
                                <Button
                                    variant="outline-secondary"
                                    className="w-100 rounded-pill fw-bold"
                                    onClick={() => fetchData(1)}
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
                                    Memuat data pelanggan...
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="fs-1 text-muted">—</div>

                                <div className="fw-bold text-muted">
                                    Tidak ada pelanggan ditemukan.
                                </div>
                            </div>
                        ) : (
                            <>
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
                                            minWidth: 1250,
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

                                                <th style={{ width: 150 }}>
                                                    IDPEL
                                                </th>

                                                <th style={{ width: 95 }}>
                                                    Unitup
                                                </th>

                                                <th style={{ width: 230 }}>
                                                    Nama Pelanggan
                                                </th>

                                                <th style={{ width: 330 }}>
                                                    Alamat
                                                </th>

                                                <th style={{ width: 80 }}>
                                                    Tarif
                                                </th>

                                                <th style={{ width: 95 }}>
                                                    Daya
                                                </th>

                                                <th style={{ width: 190 }}>
                                                    Tikor
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
                                            {filteredData.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="ps-4">
                                                        <Badge bg="light" text="dark" className="rounded-pill">
                                                            #{item.id}
                                                        </Badge>
                                                    </td>

                                                    <td className="fw-bold" style={{ color: PLN_BLUE }}>
                                                        {item.idpel || '-'}
                                                    </td>

                                                    <td>
                                                        <Badge bg="secondary" className="rounded-pill">
                                                            {item.unitup || '-'}
                                                        </Badge>
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="fw-semibold text-truncate"
                                                            title={item.nama_pelanggan || '-'}
                                                            style={{ maxWidth: 220 }}
                                                        >
                                                            {item.nama_pelanggan || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="small text-muted text-truncate"
                                                            title={item.alamat_pelanggan || '-'}
                                                            style={{ maxWidth: 320 }}
                                                        >
                                                            {item.alamat_pelanggan || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <Badge bg="info" text="dark" className="rounded-pill">
                                                            {item.tarif || '-'}
                                                        </Badge>
                                                    </td>

                                                    <td className="fw-semibold">
                                                        {item.daya || '-'}
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="small text-muted text-truncate"
                                                            title={item.tikor || '-'}
                                                            style={{ maxWidth: 180 }}
                                                        >
                                                            {item.tikor || '-'}
                                                        </div>
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
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>

                                {meta && meta.last_page > 1 && (
                                    <div className="d-flex justify-content-center align-items-center gap-2 p-3 border-top">
                                        <Button
                                            variant="light"
                                            className="rounded-pill fw-bold border shadow-sm px-4"
                                            disabled={loading || meta.current_page <= 1}
                                            onClick={() => fetchData(meta.current_page - 1)}
                                        >
                                            Sebelumnya
                                        </Button>

                                        <Badge bg="light" text="dark" className="rounded-pill px-3 py-2 border">
                                            Halaman {meta.current_page} / {meta.last_page}
                                        </Badge>

                                        <Button
                                            variant="light"
                                            className="rounded-pill fw-bold border shadow-sm px-4"
                                            disabled={loading || meta.current_page >= meta.last_page}
                                            onClick={() => fetchData(meta.current_page + 1)}
                                        >
                                            Berikutnya
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}