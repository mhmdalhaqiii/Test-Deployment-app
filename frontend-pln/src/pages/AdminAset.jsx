import { useCallback, useEffect, useState } from 'react';
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

function getPelangganLabel(pelanggan) {
    return `${pelanggan.idpel || '-'} - ${pelanggan.nama_pelanggan || 'Tanpa Nama'} - Unit ${pelanggan.unitup || '-'}`;
}

function getStatusBadge(status) {
    if (status === 'selesai') {
        return (
            <Badge bg="success" className="rounded-pill px-3 py-2">
                Selesai
            </Badge>
        );
    }

    return (
        <Badge bg="warning" text="dark" className="rounded-pill px-3 py-2">
            Belum
        </Badge>
    );
}

export default function AdminAset() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [asetData, setAsetData] = useState([]);
    const [pelangganOptions, setPelangganOptions] = useState([]);

    const [meta, setMeta] = useState(null);
    const [serverStatistik, setServerStatistik] = useState({
        total_aset: 0,
        total_filter: 0,
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchPelanggan, setSearchPelanggan] = useState('');
    const [loadingPelanggan, setLoadingPelanggan] = useState(false);

    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editData, setEditData] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        pelanggan_id: '',
        nomor_kwh: '',
        merek_kwh: '',
        thtera_kwh: '',
        faktor_kali_dil: '',
        tikor_baru: '',
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

            const response = await api.get('/aset', {
                params: {
                    search: searchTerm,
                    page,
                    per_page: 10,
                },
            });

            const data = response.data.data || [];

            setAsetData(Array.isArray(data) ? data : []);
            setMeta(response.data.meta || null);
            setServerStatistik(response.data.statistik || {
                total_aset: 0,
                total_filter: 0,
            });
        } catch (error) {
            console.error('Gagal memuat aset:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data aset gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    const fetchPelangganOptions = useCallback(async (keyword = '') => {
        try {
            setLoadingPelanggan(true);

            const response = await api.get('/pelanggan', {
                params: {
                    available_for_aset: 1,
                    search: keyword,
                    page: 1,
                    per_page: 25,
                },
            });

            const data = response.data.data || [];

            setPelangganOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Gagal memuat pilihan pelanggan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Pelanggan',
                message: error.response?.data?.message || 'Pilihan pelanggan gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoadingPelanggan(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [fetchData]);

    const filteredData = asetData;

    const totalAset = serverStatistik.total_aset || meta?.total || filteredData.length;
    const totalFilter = meta?.total ?? serverStatistik.total_filter ?? filteredData.length;
    const jumlahDitampilkan = filteredData.length;

    const resetForm = () => {
        setEditData(null);

        setFormData({
            pelanggan_id: '',
            nomor_kwh: '',
            merek_kwh: '',
            thtera_kwh: '',
            faktor_kali_dil: '',
            tikor_baru: '',
        });
    };

    const openCreateModal = async () => {
        resetForm();
        setSearchPelanggan('');
        setShowFormModal(true);
        await fetchPelangganOptions('');
    };

    const openEditModal = (item) => {
        setEditData(item);

        setFormData({
            pelanggan_id: item.pelanggan_id || '',
            nomor_kwh: item.nomor_kwh || '',
            merek_kwh: item.merek_kwh || '',
            thtera_kwh: item.thtera_kwh || '',
            faktor_kali_dil: item.faktor_kali_dil || '',
            tikor_baru: item.tikor_baru || '',
        });
        setPelangganOptions(item.pelanggan ? [item.pelanggan] : []);
        setShowFormModal(true);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'merek_kwh' ? value.toUpperCase() : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);

            const payload = {
                pelanggan_id: formData.pelanggan_id,
                nomor_kwh: formData.nomor_kwh,
                merek_kwh: formData.merek_kwh.toUpperCase(),
                thtera_kwh: formData.thtera_kwh,
                faktor_kali_dil: formData.faktor_kali_dil,
                tikor_baru: formData.tikor_baru,
            };

            if (editData) {
                await api.put(`/aset/${editData.id}`, payload);
            } else {
                await api.post('/aset', payload);
            }

            setShowFormModal(false);

            setModalNotif({
                show: true,
                title: editData ? 'Aset Diperbarui' : 'Aset Ditambahkan',
                message: editData
                    ? 'Data aset APP TR berhasil diperbarui.'
                    : 'Data aset APP TR berhasil ditambahkan.',
                isSuccess: true,
            });

            await fetchData(meta?.current_page || 1);
        } catch (error) {
            console.error('Gagal menyimpan aset:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: error.response?.data?.message || 'Data aset gagal disimpan.',
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

            await api.delete(`/aset/${deleteTarget.id}`);

            setShowDeleteModal(false);
            setDeleteTarget(null);

            setModalNotif({
                show: true,
                title: 'Aset Dihapus',
                message: 'Data aset berhasil dihapus.',
                isSuccess: true,
            });

            await fetchData(meta?.current_page || 1);
        } catch (error) {
            console.error('Gagal menghapus aset:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menghapus',
                message: error.response?.data?.message || 'Aset gagal dihapus. Pastikan aset tidak sedang dipakai oleh tiket.',
                isSuccess: false,
            });
        } finally {
            setDeleting(false);
        }
    };

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
                        Hapus Aset?
                    </h5>

                    <p className="text-muted small mb-3">
                        Data aset ini akan dihapus. Tindakan ini tidak bisa dibatalkan.
                    </p>

                    <div className="bg-light rounded-4 p-3 mb-4 text-start">
                        <div className="small text-muted fw-bold mb-1">
                            Nomor kWh
                        </div>

                        <div className="fw-bold" style={{ color: PLN_BLUE }}>
                            {deleteTarget?.nomor_kwh || '-'}
                        </div>

                        <div className="small text-muted mt-2">
                            Pelanggan: {deleteTarget?.pelanggan?.nama_pelanggan || '-'}
                        </div>

                        <div className="small text-muted mt-1">
                            IDPEL: {deleteTarget?.pelanggan?.idpel || '-'}
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
                                'Ya, Hapus Aset'
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
                            {editData ? 'Edit Aset APP TR' : 'Tambah Aset APP TR'}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Pelanggan
                                    </Form.Label>

                                    {!editData && (
                                        <InputGroup className="mb-2">
                                            <InputGroup.Text className="bg-light border-0">
                                                🔎
                                            </InputGroup.Text>

                                            <Form.Control
                                                className="bg-light border-0"
                                                placeholder="Cari IDPEL / nama pelanggan..."
                                                value={searchPelanggan}
                                                onChange={async (event) => {
                                                    const value = event.target.value;
                                                    setSearchPelanggan(value);
                                                    await fetchPelangganOptions(value);
                                                }}
                                            />
                                        </InputGroup>
                                    )}

                                    <Form.Select
                                        name="pelanggan_id"
                                        value={formData.pelanggan_id}
                                        onChange={handleChange}
                                        required
                                        disabled={Boolean(editData) || loadingPelanggan}
                                    >
                                        <option value="">
                                            {loadingPelanggan ? 'Memuat pelanggan...' : 'Pilih pelanggan'}
                                        </option>

                                        {pelangganOptions.map((pelanggan) => (
                                            <option key={pelanggan.id} value={pelanggan.id}>
                                                {getPelangganLabel(pelanggan)}
                                            </option>
                                        ))}
                                    </Form.Select>

                                    {!editData && pelangganOptions.length === 0 && !loadingPelanggan && (
                                        <div className="small text-danger mt-1">
                                            Tidak ada pelanggan tersedia. Coba cari IDPEL/nama pelanggan lain.
                                        </div>
                                    )}

                                    {editData && (
                                        <div className="small text-muted mt-1">
                                            Pelanggan tidak diubah saat edit aset, agar relasi aset dan tiket tetap aman.
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Nomor kWh
                                    </Form.Label>

                                    <Form.Control
                                        name="nomor_kwh"
                                        value={formData.nomor_kwh}
                                        onChange={handleChange}
                                        placeholder="Contoh: 86012345678"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Merek kWh
                                    </Form.Label>

                                    <Form.Control
                                        name="merek_kwh"
                                        value={formData.merek_kwh}
                                        onChange={handleChange}
                                        placeholder="Contoh: EDMI / ITRON / HEXING"
                                        required
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tahun Tera kWh
                                    </Form.Label>

                                    <Form.Control
                                        name="thtera_kwh"
                                        value={formData.thtera_kwh}
                                        onChange={handleChange}
                                        placeholder="Contoh: 2025"
                                        maxLength={4}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Faktor Kali DIL
                                    </Form.Label>

                                    <Form.Control
                                        type="number"
                                        step="0.001"
                                        name="faktor_kali_dil"
                                        value={formData.faktor_kali_dil}
                                        onChange={handleChange}
                                        placeholder="Contoh: 40"
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Tikor Baru
                                    </Form.Label>

                                    <Form.Control
                                        name="tikor_baru"
                                        value={formData.tikor_baru}
                                        onChange={handleChange}
                                        placeholder="Contoh: -2.964745, 104.744898"
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
                                        Kelola Aset APP TR
                                    </div>

                                    <div className="text-white-50 small">
                                        Kelola data kWh, tahun tera, faktor kali DIL, dan titik koordinat aset.
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
                                    + Tambah Aset
                                </Button>
                            </div>
                        </div>

                        <Row className="g-3 mt-4">
                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total Aset</div>
                                    <div className="display-6 fw-bold mb-0">{totalAset}</div>
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
                                    Daftar Aset APP TR
                                </h5>

                                <div className="small text-muted">
                                    Cari berdasarkan IDPEL, nama pelanggan, nomor kWh, merek, tahun tera, faktor kali, atau tikor.
                                </div>
                            </Col>

                            <Col xs={12} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0 rounded-start-pill">
                                        🔎
                                    </InputGroup.Text>

                                    <Form.Control
                                        className="bg-light border-0 rounded-end-pill"
                                        placeholder="Cari IDPEL, pelanggan, nomor kWh..."
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
                                    Memuat data aset...
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="fs-1 text-muted">—</div>

                                <div className="fw-bold text-muted">
                                    Tidak ada aset ditemukan.
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
                                            minWidth: 1450,
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

                                                <th style={{ width: 90 }}>
                                                    Unit UP
                                                </th>

                                                <th style={{ width: 250 }}>
                                                    Pelanggan
                                                </th>

                                                <th style={{ width: 160 }}>
                                                    Nomor kWh
                                                </th>

                                                <th style={{ width: 120 }}>
                                                    Merek
                                                </th>

                                                <th style={{ width: 110 }}>
                                                    Tahun Tera
                                                </th>

                                                <th style={{ width: 110 }}>
                                                    Faktor Kali
                                                </th>

                                                <th style={{ width: 190 }}>
                                                    Tikor Baru
                                                </th>

                                                <th style={{ width: 130 }}>
                                                    Status
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
                                                        {item.pelanggan?.idpel || '-'}
                                                    </td>

                                                    <td>
                                                        <Badge bg="secondary" className="rounded-pill">
                                                            {item.pelanggan?.unitup || '-'}
                                                        </Badge>
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="fw-semibold text-truncate"
                                                            title={item.pelanggan?.nama_pelanggan || '-'}
                                                            style={{ maxWidth: 240 }}
                                                        >
                                                            {item.pelanggan?.nama_pelanggan || '-'}
                                                        </div>

                                                        <div
                                                            className="small text-muted text-truncate"
                                                            title={item.pelanggan?.alamat_pelanggan || '-'}
                                                            style={{ maxWidth: 240 }}
                                                        >
                                                            {item.pelanggan?.alamat_pelanggan || '-'}
                                                        </div>
                                                    </td>

                                                    <td className="fw-semibold">
                                                        {item.nomor_kwh || '-'}
                                                    </td>

                                                    <td>
                                                        <Badge bg="info" text="dark" className="rounded-pill">
                                                            {item.merek_kwh || '-'}
                                                        </Badge>
                                                    </td>

                                                    <td>
                                                        {item.thtera_kwh || '-'}
                                                    </td>

                                                    <td className="fw-semibold">
                                                        {item.faktor_kali_dil || '-'}
                                                    </td>

                                                    <td>
                                                        <div
                                                            className="small text-muted text-truncate"
                                                            title={item.tikor_baru || '-'}
                                                            style={{ maxWidth: 180 }}
                                                        >
                                                            {item.tikor_baru || '-'}
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {getStatusBadge(item.status_pekerjaan)}
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
                                                                style={{
                                                                    color: PLN_BLUE,
                                                                    borderColor: PLN_BLUE,
                                                                }}
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