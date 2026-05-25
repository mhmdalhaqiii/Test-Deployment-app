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
    { key: 'semua', label: 'Semua' },
    { key: 'berjalan', label: 'Berjalan' },
    { key: 'dikerjakan', label: 'Dikerjakan' },
    { key: 'inReview', label: 'Review Admin' },
    { key: 'menungguValidasi', label: 'Validasi' },
    { key: 'selesai', label: 'Selesai' },
];

const STATUS_META = {
    berjalan: {
        label: 'Berjalan',
        badge: 'secondary',
        border: 'secondary',
    },
    dikerjakan: {
        label: 'Dikerjakan',
        badge: 'warning',
        border: 'warning',
    },
    inReview: {
        label: 'Review Admin',
        badge: 'primary',
        border: 'primary',
    },
    menungguValidasi: {
        label: 'Menunggu Validasi',
        badge: 'info',
        border: 'info',
    },
    selesai: {
        label: 'Selesai',
        badge: 'success',
        border: 'success',
    },
};

const getStatusInfo = (status) => {
    return STATUS_META[status] || {
        label: status || '-',
        badge: 'secondary',
        border: 'secondary',
    };
};

const formatTanggal = (value) => {
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
};

const getInitial = (name) => {
    return (name || 'M').charAt(0).toUpperCase();
};

const getPekerjaanViewData = (item) => {
    const pelanggan = item.aset?.pelanggan;
    const pekerjaan = item.pekerjaan;

    return {
        namaPelanggan: pelanggan?.nama_pelanggan || item.nama_pelanggan || 'Tanpa Nama',
        idpel: pelanggan?.idpel || pekerjaan?.idpel || '-',
        alamat: pelanggan?.alamat_pelanggan || item.alamat_pelanggan || 'Alamat tidak tersedia',
        namaTim: item.tim?.nama_tim || pekerjaan?.tim?.nama_tim || pekerjaan?.tim?.nama || item.tim?.nama || '-',
        namaPetugas: pekerjaan?.petugas?.nama_petugas || '-',
        rekomendasi: pekerjaan?.rekomendasi || '-',
        updateTerakhir: item.updated_at || item.tanggal_tiket,
    };
};

function LogoutIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            className="bi bi-box-arrow-right"
            viewBox="0 0 16 16"
        >
            <path
                fillRule="evenodd"
                d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
            />
            <path
                fillRule="evenodd"
                d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
            />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-search"
            viewBox="0 0 16 16"
        >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
        </svg>
    );
}

function NotificationModal({ modalNotif, onClose }) {
    return (
        <Modal show={modalNotif.show} onHide={onClose} centered size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-3">
                    {modalNotif.isSuccess ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            fill="#198754"
                            className="bi bi-check-circle-fill"
                            viewBox="0 0 16 16"
                        >
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            fill="#dc3545"
                            className="bi bi-x-circle-fill"
                            viewBox="0 0 16 16"
                        >
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                        </svg>
                    )}
                </div>

                <h5 className="fw-bold mb-2">{modalNotif.title}</h5>
                <p className="text-muted small mb-4">{modalNotif.message}</p>

                <Button
                    variant={modalNotif.isSuccess ? 'success' : 'danger'}
                    className="w-100 rounded-pill fw-semibold"
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
                <div className="fw-semibold text-muted mt-3">Memuat data pekerjaan...</div>
            </Card.Body>
        </Card>
    );
}

function EmptyState({ isFiltered }) {
    return (
        <Alert variant="light" className="border-0 shadow-sm rounded-4 text-center py-5">
            <div className="display-6 fw-bold text-muted mb-2">—</div>
            <h5 className="fw-bold mb-2">
                {isFiltered ? 'Pekerjaan tidak ditemukan' : 'Belum ada pekerjaan di sistem'}
            </h5>
            <p className="text-muted small mb-0">
                {isFiltered
                    ? 'Coba ubah kata kunci atau ganti filter status.'
                    : 'Data pekerjaan akan muncul setelah diproses oleh tim lapangan.'}
            </p>
        </Alert>
    );
}

function HeroPanel({
    user,
    statistik,
    hariIniCount,
    activeStatusLabel,
    searchTerm,
    setSearchTerm,
    fetchPekerjaanManajer,
    loading,
    filterStatus,
    setFilterStatus,
    statusCounts,
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
                            <div className="fw-bold fs-5 lh-sm">UP3 Palembang</div>
                            <div className="text-white-50 small">Monitoring Pemeliharaan APP TR Tak Langsung</div>
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
                            className="rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm"
                            style={{ color: PLN_BLUE }}
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogoutIcon />
                        </Button>
                    </div>
                </div>

                <Row className="g-4 align-items-end mb-4">
                    <Col lg={5}>
                        <h2 className="fw-bold mb-2">Selamat datang, {user?.name || 'Manajer'}</h2>
                        <p className="text-white-50 mb-0">
                            Pantau pekerjaan lapangan dan lakukan validasi akhir dari laporan yang sudah siap.
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
                                    <div className="small text-white-50">Hari Ini</div>
                                    <div className="display-6 fw-bold mb-0">{hariIniCount}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3}>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Validasi</div>
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
                                <SearchIcon />
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
                                onClick={fetchPekerjaanManajer}
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

function PekerjaanCard({ item, onDetail }) {
    const statusInfo = getStatusInfo(item.status);
    const data = getPekerjaanViewData(item);

    return (
        <Card className={`border-0 shadow-sm rounded-4 border-start border-4 border-${statusInfo.border} mb-3 overflow-hidden`}>
            <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                    <div>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                            <h5 className="fw-bold mb-0 text-dark">{data.namaPelanggan}</h5>
                            <Badge bg={statusInfo.badge} className="rounded-pill px-3 py-2">
                                {statusInfo.label}
                            </Badge>
                        </div>

                        <div className="d-flex flex-wrap gap-3 small text-muted fw-semibold">
                            <span>
                                IDPEL <span className="text-dark">{data.idpel}</span>
                            </span>
                            <span>
                                Tiket <span className="text-dark">{item.nomor_tiket || '-'}</span>
                            </span>
                            <span>
                                Update <span className="text-dark">{formatTanggal(data.updateTerakhir)}</span>
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
                            Lihat Detail
                        </Button>
                    </div>
                </div>

                <div className="border-top pt-3">
                    <Row className="g-3">
                        <Col xs={12} md={5}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">Alamat</div>
                            <div className="fw-semibold text-dark small">{data.alamat}</div>
                        </Col>

                        <Col xs={6} md={3}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">Tim</div>
                            <div className="fw-semibold text-dark small">{data.namaTim}</div>
                        </Col>

                        <Col xs={6} md={2}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">Petugas</div>
                            <div className="fw-semibold text-dark small">{data.namaPetugas}</div>
                        </Col>

                        <Col xs={12} md={2}>
                            <div className="small text-muted fw-bold text-uppercase mb-1">Rekomendasi</div>
                            <div className="fw-semibold text-dark small">{data.rekomendasi}</div>
                        </Col>
                    </Row>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function DashboardManajer() {
    const navigate = useNavigate();

    const [user] = useState(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : { name: 'Manajer' };
    });

    const [loading, setLoading] = useState(true);
    const [pekerjaanData, setPekerjaanData] = useState([]);
    const [filterStatus, setFilterStatus] = useState('semua');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    useEffect(() => {
        fetchPekerjaanManajer();
    }, []);

    const fetchPekerjaanManajer = async () => {
        try {
            setLoading(true);

            const response = await api.get('/manajer/pekerjaan', {
                params: { status: 'semua' },
            });

            const data = response.data.data || response.data || [];
            setPekerjaanData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Gagal memuat pekerjaan manajer:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Data',
                message: error.response?.data?.message || 'Data pekerjaan manajer gagal dimuat.',
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
        const countByStatus = (status) => pekerjaanData.filter((item) => item.status === status).length;

        return {
            total: pekerjaanData.length,
            berjalan: countByStatus('berjalan'),
            dikerjakan: countByStatus('dikerjakan'),
            inReview: countByStatus('inReview'),
            menungguValidasi: countByStatus('menungguValidasi'),
            selesai: countByStatus('selesai'),
        };
    }, [pekerjaanData]);

    const hariIniCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);

        return pekerjaanData.filter((item) => {
            const date = item.updated_at?.slice(0, 10) || item.tanggal_tiket;
            return date === today;
        }).length;
    }, [pekerjaanData]);

    const statusCounts = useMemo(() => {
        return STATUS_OPTIONS.reduce((result, option) => {
            result[option.key] = option.key === 'semua'
                ? pekerjaanData.length
                : pekerjaanData.filter((item) => item.status === option.key).length;

            return result;
        }, {});
    }, [pekerjaanData]);

    const filteredData = useMemo(() => {
        let result = [...pekerjaanData];

        if (filterStatus !== 'semua') {
            result = result.filter((item) => item.status === filterStatus);
        }

        const keyword = searchTerm.trim().toLowerCase();

        if (keyword) {
            result = result.filter((item) => {
                const pelanggan = item.aset?.pelanggan;
                const pekerjaan = item.pekerjaan;

                const searchable = [
                    item.nomor_tiket,
                    pelanggan?.nama_pelanggan,
                    pelanggan?.idpel,
                    pekerjaan?.idpel,
                    pelanggan?.alamat_pelanggan,
                    pekerjaan?.petugas?.nama_petugas,
                    item.tim?.nama_tim,
                    pekerjaan?.tim?.nama_tim,
                    pekerjaan?.rekomendasi,
                    item.status,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(keyword);
            });
        }

        return result;
    }, [pekerjaanData, filterStatus, searchTerm]);

    const activeStatusLabel = STATUS_OPTIONS.find((option) => option.key === filterStatus)?.label || 'Semua';
    const isFiltered = filterStatus !== 'semua' || searchTerm.trim() !== '';

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
                    hariIniCount={hariIniCount}
                    activeStatusLabel={activeStatusLabel}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    fetchPekerjaanManajer={fetchPekerjaanManajer}
                    loading={loading}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    statusCounts={statusCounts}
                    handleLogout={handleLogout}
                />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4 px-1">
                    <div>
                        <h4 className="fw-bold mb-1 text-dark">Data Lapangan</h4>
                        <div className="small text-muted">
                            Ditemukan <span className="fw-bold text-dark">{filteredData.length}</span> laporan pekerjaan
                        </div>
                    </div>

                    {isFiltered && (
                        <Button
                            variant="light"
                            className="rounded-pill fw-bold border shadow-sm px-4"
                            onClick={() => {
                                setFilterStatus('semua');
                                setSearchTerm('');
                            }}
                        >
                            Bersihkan Filter
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
                            <PekerjaanCard
                                key={item.id}
                                item={item}
                                onDetail={(id) => navigate(`/manajer/pekerjaan/${id}`)}
                            />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
