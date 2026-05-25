import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'react-bootstrap';
import api from '../services/api';

const PLN_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';
const PLN_BLUE = '#0c2b4d';

const STATUS_OPTIONS = [
    { key: 'inReview', label: 'Menunggu Review' },
    { key: 'menungguValidasi', label: 'Diteruskan ke Manajer' },
    { key: 'selesai', label: 'Selesai' },
];

const STATUS_META = {
    inReview: {
        label: 'Menunggu Review Admin',
        badge: 'primary',
        border: 'primary',
    },
    menungguValidasi: {
        label: 'Menunggu Validasi Manajer',
        badge: 'info',
        border: 'info',
    },
    selesai: {
        label: 'Selesai',
        badge: 'success',
        border: 'success',
    },
};

function getStatusInfo(status) {
    return STATUS_META[status] || {
        label: status || '-',
        badge: 'secondary',
        border: 'secondary',
    };
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

function getInitial(name) {
    return (name || 'A').charAt(0).toUpperCase();
}

function getPekerjaanViewData(item) {
    const tiket = item.tiket;
    const pelanggan = tiket?.aset?.pelanggan;

    return {
        namaPelanggan: pelanggan?.nama_pelanggan || 'Tanpa Nama',
        idpel: pelanggan?.idpel || item.idpel || '-',
        alamat: pelanggan?.alamat_pelanggan || 'Alamat tidak tersedia',
        nomorTiket: tiket?.nomor_tiket || '-',
        status: tiket?.status || '-',
        namaTim: item.tim?.nama_tim || item.tim?.nama || '-',
        namaPetugas: item.petugas?.nama_petugas || '-',
        rekomendasi: item.rekomendasi || '-',
        catatanCt: item.catatan_ct || '-',
        tanggal: item.tanggal || item.updated_at,
    };
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

function LoadingState() {
    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="text-center py-5">
                <Spinner animation="border" style={{ color: PLN_BLUE }} />
                <div className="fw-semibold text-muted mt-3">
                    Memuat data review admin...
                </div>
            </Card.Body>
        </Card>
    );
}

function EmptyState({ isFiltered }) {
    return (
        <Alert variant="light" className="border-0 shadow-sm rounded-4 text-center py-5">
            <div className="display-6 fw-bold text-muted mb-2">—</div>

            <h5 className="fw-bold mb-2">
                {isFiltered ? 'Data review tidak ditemukan' : 'Belum ada pekerjaan untuk direview'}
            </h5>

            <p className="text-muted small mb-0">
                {isFiltered
                    ? 'Coba ubah kata kunci atau filter status.'
                    : 'Pekerjaan akan muncul setelah petugas mengirim laporan.'}
            </p>
        </Alert>
    );
}

function HeroPanel({
    user,
    statistik,
    activeStatusLabel,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    statusCounts,
    loading,
    fetchData,
    handleLogout,
}) {

    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <Card.Body className="text-white p-3 p-md-4 p-xl-5" style={{ backgroundColor: PLN_BLUE }}>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-4 pb-3 border-bottom border-light border-opacity-25">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm">
                            <img
                                src={PLN_LOGO_URL}
                                alt="PLN"
                                width="26"
                                height="26"
                                className="object-fit-contain"
                            />
                        </div>

                        <div>
                            <div className="fw-bold fs-5 lh-sm">
                                UP3 Palembang
                            </div>
                            <div className="text-white-50 small">
                                Review laporan pemeliharaan APP TR Tak Langsung
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Badge
                            bg="light"
                            pill
                            className="px-3 py-2 d-none d-sm-inline-flex"
                            style={{ color: PLN_BLUE }}
                        >
                            {getInitial(user?.name)}
                        </Badge>

                        <Button
                            variant="light"
                            className="rounded-pill fw-bold px-3 shadow-sm"
                            style={{ color: PLN_BLUE }}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                <Row className="g-4 align-items-end mb-4">
                    <Col lg={5}>
                        <h2 className="fw-bold mb-2">
                            Selamat datang, {user?.name || 'Admin'}
                        </h2>

                        <p className="text-white-50 mb-0">
                            Cek laporan petugas, lihat foto pekerjaan, lalu teruskan ke manajer untuk validasi akhir.
                        </p>
                    </Col>

                    <Col lg={7}>
                        <Row className="g-3 text-center text-md-start">
                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.total}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Review</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.inReview}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Ke Manajer</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.menungguValidasi}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Status</div>
                                    <div className="h6 fw-bold mb-0 text-truncate">{activeStatusLabel}</div>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Row className="g-3 align-items-center mb-4">
                    <Col lg={10}>
                        <InputGroup className="shadow-sm rounded-pill overflow-hidden bg-white">
                            <InputGroup.Text className="bg-white border-0 text-muted ps-4">
                                🔎
                            </InputGroup.Text>

                            <Form.Control
                                placeholder="Cari nama pelanggan, IDPEL, nomor tiket, tim, atau petugas..."
                                className="border-0 shadow-none py-2"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </InputGroup>
                    </Col>

                    <Col lg={2}>
                        <div className="d-grid">
                            <Button
                                variant="light"
                                className="fw-bold rounded-pill shadow-sm py-2"
                                style={{ color: PLN_BLUE }}
                                onClick={fetchData}
                                disabled={loading}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                            </Button>
                        </div>
                    </Col>
                </Row>

                <div className="pt-3 border-top border-light border-opacity-25">
                    <div className="d-flex gap-2 overflow-auto justify-content-lg-center pb-1">
                        {STATUS_OPTIONS.map((option) => {
                            const isActive = filterStatus === option.key;

                            return (
                                <Button
                                    key={option.key}
                                    variant={isActive ? 'light' : 'outline-light'}
                                    className="rounded-pill fw-semibold text-nowrap d-flex align-items-center gap-2 px-3 py-2"
                                    onClick={() => setFilterStatus(option.key)}
                                >
                                    <span>{option.label}</span>

                                    <Badge
                                        bg={isActive ? 'primary' : 'light'}
                                        text={isActive ? undefined : 'dark'}
                                        pill
                                    >
                                        {statusCounts[option.key] || 0}
                                    </Badge>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

function ReviewCard({ item, onDetail }) {
    const data = getPekerjaanViewData(item);
    const statusInfo = getStatusInfo(data.status);

    return (
        <Card className={`border-0 shadow-sm rounded-4 border-start border-4 border-${statusInfo.border} mb-3 overflow-hidden`}>
            <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                    <div>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                            <h5 className="fw-bold mb-0 text-dark">
                                {data.namaPelanggan}
                            </h5>

                            <Badge bg={statusInfo.badge} className="rounded-pill px-3 py-2">
                                {statusInfo.label}
                            </Badge>
                        </div>

                        <div className="d-flex flex-wrap gap-3 small text-muted fw-semibold">
                            <span>
                                IDPEL <span className="text-dark">{data.idpel}</span>
                            </span>

                            <span>
                                Tiket <span className="text-dark">{data.nomorTiket}</span>
                            </span>

                            <span>
                                Tanggal <span className="text-dark">{formatTanggal(data.tanggal)}</span>
                            </span>
                        </div>
                    </div>

                    <div className="d-grid align-content-start">
                        <Button
                            variant="outline-primary"
                            className="rounded-pill fw-bold px-4"
                            style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                            onClick={() => onDetail(item.id)}
                        >
                            Lihat Review
                        </Button>
                    </div>
                </div>

                <div className="border-top pt-3">
                    <Row className="g-3">
                        <Col xs={12} md={5}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">
                                Alamat
                            </div>
                            <div className="fw-semibold text-dark small">
                                {data.alamat}
                            </div>
                        </Col>

                        <Col xs={6} md={2}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">
                                Tim
                            </div>
                            <div className="fw-semibold text-dark small">
                                {data.namaTim}
                            </div>
                        </Col>

                        <Col xs={6} md={2}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">
                                Petugas
                            </div>
                            <div className="fw-semibold text-dark small">
                                {data.namaPetugas}
                            </div>
                        </Col>

                        <Col xs={6} md={1}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">
                                CT
                            </div>
                            <div className="fw-semibold text-dark small">
                                {data.catatanCt}
                            </div>
                        </Col>

                        <Col xs={6} md={2}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">
                                Rekomendasi
                            </div>
                            <div className="fw-semibold text-dark small">
                                {data.rekomendasi}
                            </div>
                        </Col>
                    </Row>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function DashboardAdmin() {
    const navigate = useNavigate();

    const [user] = useState(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : { name: 'Admin' };
    });

    const [loading, setLoading] = useState(true);
    const [pekerjaanData, setPekerjaanData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('inReview');
    const [searchTerm, setSearchTerm] = useState('');

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const responses = await Promise.all(
                STATUS_OPTIONS.map((option) =>
                    api.get('/admin/pekerjaan-review', {
                        params: { status: option.key },
                    })
                )
            );

            const merged = responses.flatMap((response) => {
                const data = response.data.data || response.data || [];
                return Array.isArray(data) ? data : [];
            });

            setPekerjaanData(merged);
        } catch (error) {
            console.error('Gagal memuat data admin review:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data review admin gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const statistik = useMemo(() => {
        const countByStatus = (status) =>
            pekerjaanData.filter((item) => item.tiket?.status === status).length;

        return {
            total: pekerjaanData.length,
            inReview: countByStatus('inReview'),
            menungguValidasi: countByStatus('menungguValidasi'),
            selesai: countByStatus('selesai'),
        };
    }, [pekerjaanData]);

    const statusCounts = useMemo(() => {
        return STATUS_OPTIONS.reduce((result, option) => {
            result[option.key] = pekerjaanData.filter((item) => item.tiket?.status === option.key).length;
            return result;
        }, {});
    }, [pekerjaanData]);

    const filteredData = useMemo(() => {
        let result = [...pekerjaanData];

        result = result.filter((item) => item.tiket?.status === filterStatus);

        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
            result = result.filter((item) => {
                const data = getPekerjaanViewData(item);

                const searchable = [
                    data.namaPelanggan,
                    data.idpel,
                    data.alamat,
                    data.nomorTiket,
                    data.namaTim,
                    data.namaPetugas,
                    data.rekomendasi,
                    data.catatanCt,
                    data.status,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(keyword);
            });
        }

        return result;
    }, [pekerjaanData, filterStatus, searchTerm]);

    const activeStatusLabel =
        STATUS_OPTIONS.find((option) => option.key === filterStatus)?.label || 'Menunggu Review';

    const isFiltered = searchTerm.trim() !== '';

    return (
        <div className="min-vh-100 bg-light py-3 py-lg-4">
            <NotificationModal
                modalNotif={modalNotif}
                onClose={() => setModalNotif((prev) => ({ ...prev, show: false }))}
            />

            <Container fluid="xl">
                <HeroPanel
                    user={user}
                    statistik={statistik}
                    activeStatusLabel={activeStatusLabel}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    statusCounts={statusCounts}
                    loading={loading}
                    fetchData={fetchData}
                    handleLogout={handleLogout}
                />

                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-3 p-md-4">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                            <div>
                                <h5 className="fw-bold mb-1" style={{ color: PLN_BLUE }}>
                                    Menu Fitur Admin
                                </h5>
                                <div className="small text-muted">
                                    Pusat pengelolaan data dan monitoring pekerjaan pemeliharaan APP TR.
                                </div>
                            </div>

                            <Badge bg="primary" className="rounded-pill px-3 py-2">
                                Admin Super
                            </Badge>
                        </div>

                        <Row className="g-3">
                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">📋</div>
                                        <h6 className="fw-bold mb-1">Review Laporan</h6>
                                        <p className="small text-muted mb-3">
                                            Periksa laporan petugas dan teruskan ke manajer.
                                        </p>
                                        <Button
                                            size="sm"
                                            className="rounded-pill fw-bold px-3"
                                            style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                            onClick={() => {
                                                setFilterStatus('inReview');
                                                window.scrollTo({ top: 520, behavior: 'smooth' });
                                            }}
                                        >
                                            Buka Review
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">👥</div>
                                        <h6 className="fw-bold mb-1">Kelola Pelanggan</h6>
                                        <p className="small text-muted mb-3">
                                            Tambah, edit, dan lihat data pelanggan APP TR.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="rounded-pill fw-bold px-3"
                                            style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                                            onClick={() => navigate('/admin/pelanggan')}
                                        >
                                            Buka Data
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">⚙️</div>
                                        <h6 className="fw-bold mb-1">Kelola Aset APP TR</h6>
                                        <p className="small text-muted mb-3">
                                            Kelola data kWh, tahun tera, dan faktor kali DIL.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="rounded-pill fw-bold px-3"
                                            style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                                            onClick={() => navigate('/admin/aset')}
                                        >
                                            Buka Aset
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">🎫</div>
                                        <h6 className="fw-bold mb-1">Kelola Tiket</h6>
                                        <p className="small text-muted mb-3">
                                            Buat tiket pekerjaan dan pantau status pekerjaan.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            className="rounded-pill fw-bold px-3"
                                            style={{ color: PLN_BLUE, borderColor: PLN_BLUE }}
                                            onClick={() => navigate('/admin/tiket')}
                                        >
                                            Buka Tiket
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">👷</div>
                                        <h6 className="fw-bold mb-1">Kelola Pengguna</h6>
                                        <p className="small text-muted mb-3">
                                            Atur data petugas, tim, dan akun pengguna.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="rounded-pill fw-bold px-3"
                                            onClick={() => navigate('/admin/pengguna')}
                                        >
                                            Buka Pengguna
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} md={6} xl={3}>
                                <Card className="border-0 bg-light rounded-4 h-100">
                                    <Card.Body className="p-3">
                                        <div className="fs-3 mb-2">📊</div>
                                        <h6 className="fw-bold mb-1">Monitoring</h6>
                                        <p className="small text-muted mb-3">
                                            Pantau status pekerjaan dari berjalan sampai selesai.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            className="rounded-pill fw-bold px-3"
                                            onClick={() => navigate('/admin/monitoring')}
                                        >
                                            Buka Monitoring
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4 px-1">
                    <div>
                        <h4 className="fw-bold mb-1 text-dark">
                            Review Laporan Petugas
                        </h4>

                        <div className="small text-muted">
                            Ditemukan <span className="fw-bold text-dark">{filteredData.length}</span> laporan pada filter ini
                        </div>
                    </div>

                    {isFiltered && (
                        <Button
                            variant="light"
                            className="rounded-pill fw-bold border shadow-sm px-4"
                            onClick={() => setSearchTerm('')}
                        >
                            Bersihkan Pencarian
                        </Button>
                    )}
                </div>

                {loading ? (
                    <LoadingState />
                ) : filteredData.length === 0 ? (
                    <EmptyState isFiltered={isFiltered} />
                ) : (
                    <div>
                        {filteredData.map((item) => (
                            <ReviewCard
                                key={item.id}
                                item={item}
                                onDetail={(id) => navigate(`/admin/review/${id}`)}
                            />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}