import { useCallback, useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
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
    { key: 'menungguValidasi', label: 'Validasi Manajer' },
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

function ProgressRing({ value }) {
    const percent = Math.max(0, Math.min(Number(value) || 0, 100));

    return (
        <div className="d-flex align-items-center gap-3">
            <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                    width: 64,
                    height: 64,
                    background: `conic-gradient(#ffc107 ${percent}%, rgba(255,255,255,.25) 0)`,
                    color: '#fff',
                }}
            >
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: 48,
                        height: 48,
                        backgroundColor: PLN_BLUE,
                        fontSize: 13,
                    }}
                >
                    {percent}%
                </div>
            </div>

            <div>
                <div className="small text-white-50">Progress Selesai</div>
                <div className="fw-bold fs-5">{percent}%</div>
            </div>
        </div>
    );
}

export default function AdminMonitoring() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [tiketData, setTiketData] = useState([]);

    const [meta, setMeta] = useState(null);
    const [serverStatistik, setServerStatistik] = useState({
        total_tiket: 0,
        total_filter: 0,
        status_counts: {
            semua: 0,
            tersedia: 0,
            berjalan: 0,
            dikerjakan: 0,
            inReview: 0,
            menungguValidasi: 0,
            selesai: 0,
        },
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('semua');

    const [errorMessage, setErrorMessage] = useState('');

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setErrorMessage('');

            const response = await api.get('/admin/tiket', {
                params: {
                    status: filterStatus,
                    search: searchTerm,
                    page,
                    per_page: 10,
                },
            });

            const data = response.data.data || [];

            setTiketData(Array.isArray(data) ? data : []);
            setMeta(response.data.meta || null);
            setServerStatistik(response.data.statistik || {
                total_tiket: 0,
                total_filter: 0,
                status_counts: {
                    semua: 0,
                    tersedia: 0,
                    berjalan: 0,
                    dikerjakan: 0,
                    inReview: 0,
                    menungguValidasi: 0,
                    selesai: 0,
                },
            });
        } catch (error) {
            console.error('Gagal memuat monitoring:', error.response?.data || error);

            setErrorMessage(error.response?.data?.message || 'Data monitoring gagal dimuat.');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [fetchData]);

    const filteredData = tiketData;

    const statusCounts = serverStatistik.status_counts || {};

    const totalSemua = serverStatistik.total_tiket || statusCounts.semua || 0;
    const totalSelesai = statusCounts.selesai || 0;

    const statistik = {
        total: totalSemua,
        tersedia: statusCounts.tersedia || 0,
        berjalan: statusCounts.berjalan || 0,
        dikerjakan: statusCounts.dikerjakan || 0,
        inReview: statusCounts.inReview || 0,
        menungguValidasi: statusCounts.menungguValidasi || 0,
        selesai: totalSelesai,
        progress: totalSemua > 0 ? Math.round((totalSelesai / totalSemua) * 100) : 0,
    };

    const totalFilter = meta?.total ?? serverStatistik.total_filter ?? filteredData.length;
    const jumlahDitampilkan = filteredData.length;

    return (
        <div className="min-vh-100 bg-light py-3 py-lg-4">
            <Container fluid="xl">
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                    <Card.Body
                        className="text-white p-3 p-md-4 p-xl-5"
                        style={{ backgroundColor: PLN_BLUE }}
                    >
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
                                        Monitoring Pekerjaan
                                    </div>

                                    <div className="text-white-50 small">
                                        Pantau status tiket pekerjaan dari tersedia sampai selesai.
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
                                    onClick={() => fetchData(1)}
                                    disabled={loading}
                                >
                                    {loading ? 'Memuat...' : 'Refresh'}
                                </Button>
                            </div>
                        </div>

                        <Row className="g-3 mt-4 align-items-center">
                            <Col xs={12} lg={3}>
                                <ProgressRing value={statistik.progress} />
                            </Col>

                            <Col xs={6} md={3} lg>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Total</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.total}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} lg>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Tersedia</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.tersedia}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} lg>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Berjalan</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.berjalan}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} lg>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Review</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.inReview}</div>
                                </div>
                            </Col>

                            <Col xs={6} md={3} lg>
                                <div className="border-start border-light border-opacity-25 ps-3">
                                    <div className="small text-white-50">Selesai</div>
                                    <div className="display-6 fw-bold mb-0">{statistik.selesai}</div>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {errorMessage && (
                    <div className="alert alert-danger rounded-4 shadow-sm border-0">
                        {errorMessage}
                    </div>
                )}

                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-3 p-md-4">
                        <Row className="g-3 align-items-center">
                            <Col xs={12} lg={5}>
                                <h5 className="fw-bold mb-1" style={{ color: PLN_BLUE }}>
                                    Daftar Monitoring
                                </h5>

                                <div className="small text-muted">
                                    Cari berdasarkan nomor tiket, pelanggan, IDPEL, tim, status, atau petugas.
                                </div>
                            </Col>

                            <Col xs={12} lg={5}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0 rounded-start-pill">
                                        🔎
                                    </InputGroup.Text>

                                    <Form.Control
                                        className="bg-light border-0 rounded-end-pill"
                                        placeholder="Cari tiket, IDPEL, pelanggan, tim..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs={12} lg={2}>
                                <div className="small text-muted text-lg-end">
                                    Menampilkan <strong>{jumlahDitampilkan}</strong> dari <strong>{totalFilter}</strong> data
                                </div>
                            </Col>
                        </Row>

                        <div className="d-flex gap-2 overflow-auto pt-3 mt-3 border-top pb-1">
                            {STATUS_OPTIONS.map((status) => {
                                const isActive = filterStatus === status.key;

                                return (
                                    <Button
                                        key={status.key}
                                        size="sm"
                                        className="rounded-pill fw-bold px-3 flex-shrink-0 d-flex align-items-center gap-2"
                                        variant={isActive ? 'primary' : 'light'}
                                        style={
                                            isActive
                                                ? {
                                                    backgroundColor: PLN_BLUE,
                                                    border: 'none',
                                                    minWidth: 'fit-content',
                                                }
                                                : {
                                                    border: '1px solid #dee2e6',
                                                    minWidth: 'fit-content',
                                                }
                                        }
                                        onClick={() => setFilterStatus(status.key)}
                                    >
                                        <span>{status.label}</span>

                                        <Badge
                                            bg={isActive ? 'light' : 'secondary'}
                                            text={isActive ? 'dark' : undefined}
                                            pill
                                            className="px-2"
                                        >
                                            {statusCounts[status.key] || 0}
                                        </Badge>
                                    </Button>
                                );
                            })}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm rounded-4">
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" style={{ color: PLN_BLUE }} />

                                    <div className="small text-muted mt-2">
                                        Memuat data monitoring...
                                    </div>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="fs-1 text-muted">—</div>

                                    <div className="fw-bold text-muted">
                                        Tidak ada data monitoring ditemukan.
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
                                                minWidth: 1500,
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
                                                    <th className="ps-4" style={{ width: 70 }}>ID</th>
                                                    <th style={{ width: 190 }}>Nomor Tiket</th>
                                                    <th style={{ width: 130 }}>Tanggal</th>
                                                    <th style={{ width: 140 }}>Status</th>
                                                    <th style={{ width: 160 }}>IDPEL</th>
                                                    <th style={{ width: 90 }}>Unit UP</th>
                                                    <th style={{ width: 240 }}>Pelanggan</th>
                                                    <th style={{ width: 150 }}>Nomor kWh</th>
                                                    <th style={{ width: 130 }}>Tim</th>
                                                    <th style={{ width: 160 }}>Petugas</th>
                                                    <th style={{ width: 160 }}>Rekomendasi</th>

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
                                                    const pelanggan = item.aset?.pelanggan;
                                                    const pekerjaan = item.pekerjaan;
                                                    const statusInfo = getStatusInfo(item.status);

                                                    return (
                                                        <tr key={item.id}>
                                                            <td className="ps-4">
                                                                <Badge bg="light" text="dark" className="rounded-pill">
                                                                    #{item.id}
                                                                </Badge>
                                                            </td>

                                                            <td className="fw-bold" style={{ color: PLN_BLUE }}>
                                                                {item.nomor_tiket || '-'}
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

                                                            <td className="fw-semibold">
                                                                {pelanggan?.idpel || '-'}
                                                            </td>

                                                            <td>
                                                                <Badge bg="secondary" className="rounded-pill">
                                                                    {pelanggan?.unitup || '-'}
                                                                </Badge>
                                                            </td>

                                                            <td>
                                                                <div
                                                                    className="fw-semibold text-truncate"
                                                                    title={pelanggan?.nama_pelanggan || '-'}
                                                                    style={{ maxWidth: 230 }}
                                                                >
                                                                    {pelanggan?.nama_pelanggan || '-'}
                                                                </div>

                                                                <div
                                                                    className="small text-muted text-truncate"
                                                                    title={pelanggan?.alamat_pelanggan || '-'}
                                                                    style={{ maxWidth: 230 }}
                                                                >
                                                                    {pelanggan?.alamat_pelanggan || '-'}
                                                                </div>
                                                            </td>

                                                            <td className="fw-semibold">
                                                                {item.aset?.nomor_kwh || '-'}
                                                            </td>

                                                            <td>
                                                                <Badge bg="dark" className="rounded-pill">
                                                                    {item.tim?.nama_tim || pekerjaan?.tim?.nama_tim || '-'}
                                                                </Badge>
                                                            </td>

                                                            <td>
                                                                {pekerjaan?.petugas?.nama_petugas || '-'}
                                                            </td>

                                                            <td>
                                                                <div
                                                                    className="small text-muted text-truncate"
                                                                    title={pekerjaan?.rekomendasi || '-'}
                                                                    style={{ maxWidth: 150 }}
                                                                >
                                                                    {pekerjaan?.rekomendasi || '-'}
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
                                                                {item.status === 'inReview' && pekerjaan?.id ? (
                                                                    <Button
                                                                        size="sm"
                                                                        className="rounded-pill fw-bold px-3"
                                                                        style={{
                                                                            backgroundColor: PLN_BLUE,
                                                                            border: 'none',
                                                                        }}
                                                                        onClick={() => navigate(`/admin/review/${pekerjaan.id}`)}
                                                                    >
                                                                        Review
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-secondary"
                                                                        className="rounded-pill fw-bold px-3"
                                                                        disabled
                                                                    >
                                                                        Pantau
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
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
                </Card>
            </Container>
        </div>
    );
}