import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Modal,
    Row,
    Spinner,
    Table,
} from 'react-bootstrap';
import api from '../services/api';

const PLN_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_PLN.png';
const PLN_BLUE = '#0c2b4d';

const FOTO_FIELDS = [
    { key: 'foto_arus_primer_r', label: 'Arus Primer R' },
    { key: 'foto_arus_primer_s', label: 'Arus Primer S' },
    { key: 'foto_arus_primer_t', label: 'Arus Primer T' },

    { key: 'foto_tegangan_primer_r', label: 'Tegangan Primer R' },
    { key: 'foto_tegangan_primer_s', label: 'Tegangan Primer S' },
    { key: 'foto_tegangan_primer_t', label: 'Tegangan Primer T' },

    { key: 'foto_arus_sekunder_r_ukur', label: 'Arus Sekunder Ukur R' },
    { key: 'foto_arus_sekunder_s_ukur', label: 'Arus Sekunder Ukur S' },
    { key: 'foto_arus_sekunder_t_ukur', label: 'Arus Sekunder Ukur T' },

    { key: 'foto_arus_sekunder_r_meter', label: 'Arus Sekunder Meter R' },
    { key: 'foto_arus_sekunder_s_meter', label: 'Arus Sekunder Meter S' },
    { key: 'foto_arus_sekunder_t_meter', label: 'Arus Sekunder Meter T' },

    { key: 'foto_tegangan_kwh_r', label: 'Tegangan kWh R' },
    { key: 'foto_tegangan_kwh_s', label: 'Tegangan kWh S' },
    { key: 'foto_tegangan_kwh_t', label: 'Tegangan kWh T' },
];

export default function DetailPekerjaanManajer() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [tiket, setTiket] = useState(null);

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);

            const response = await api.get(`/manajer/pekerjaan/${id}`);
            const data = response.data.data || response.data;

            setTiket(data);
        } catch (error) {
            console.error('Gagal memuat detail pekerjaan manajer:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Detail',
                message: error.response?.data?.message || 'Detail pekerjaan gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValidasi = async () => {
        try {
            setValidating(true);

            await api.post(`/manajer/pekerjaan/${id}/validasi`);

            setModalNotif({
                show: true,
                title: 'Validasi Berhasil',
                message: 'Pekerjaan berhasil divalidasi dan status berubah menjadi selesai.',
                isSuccess: true,
            });

            await fetchDetail();
        } catch (error) {
            console.error('Gagal validasi pekerjaan:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Validasi',
                message: error.response?.data?.message || 'Pekerjaan belum bisa divalidasi.',
                isSuccess: false,
            });
        } finally {
            setValidating(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'berjalan':
                return { label: 'Berjalan', badge: 'secondary' };
            case 'dikerjakan':
                return { label: 'Dikerjakan', badge: 'warning', text: 'dark' };
            case 'inReview':
                return { label: 'Menunggu Review Admin', badge: 'primary' };
            case 'menungguValidasi':
                return { label: 'Menunggu Validasi Manajer', badge: 'info', text: 'dark' };
            case 'selesai':
                return { label: 'Selesai', badge: 'success' };
            default:
                return { label: status || '-', badge: 'secondary' };
        }
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

    const formatAngka = (value, digit = 3) => {
        if (value === null || value === undefined || value === '') return '-';

        const number = Number(value);

        if (Number.isNaN(number)) return value;

        return number.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: digit,
        });
    };

    const formatPersen = (value) => {
        if (value === null || value === undefined || value === '') return '-';

        const number = Number(value);

        if (Number.isNaN(number)) return value;

        return `${(number * 100).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}%`;
    };

    const getDriveViewUrl = (fileId) => {
        if (!fileId) return '#';
        return `https://drive.google.com/file/d/${fileId}/view`;
    };

    const InfoItem = ({ label, value }) => (
        <Col xs={12} md={6} lg={4}>
            <div className="bg-light rounded-4 p-3 h-100">
                <div className="small text-muted fw-bold mb-1">{label}</div>
                <div className="fw-semibold text-dark">{value || '-'}</div>
            </div>
        </Col>
    );

    const SectionCard = ({ title, subtitle, children }) => (
        <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-3 p-md-4">
                <div className="mb-3">
                    <h5 className="fw-bold mb-1" style={{ color: PLN_BLUE }}>
                        {title}
                    </h5>
                    {subtitle && (
                        <div className="small text-muted">
                            {subtitle}
                        </div>
                    )}
                </div>

                {children}
            </Card.Body>
        </Card>
    );

    const SimpleTable = ({ rows }) => (
        <div className="table-responsive">
            <Table bordered hover className="align-middle mb-0">
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.label}>
                            <td className="fw-bold text-muted small bg-light" style={{ width: '45%' }}>
                                {row.label}
                            </td>
                            <td className="fw-semibold">
                                {row.value ?? '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );

    if (loading) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <Spinner animation="border" style={{ color: PLN_BLUE }} />
                    <div className="small text-muted mt-2">
                        Memuat detail pekerjaan...
                    </div>
                </div>
            </div>
        );
    }

    const pekerjaan = tiket?.pekerjaan;
    const pelanggan = tiket?.aset?.pelanggan;
    const aset = tiket?.aset;
    const foto = pekerjaan?.foto;
    const statusInfo = getStatusInfo(tiket?.status);

    return (
        <div className="min-vh-100 bg-light">
            <Modal
                show={modalNotif.show}
                onHide={() => setModalNotif((prev) => ({ ...prev, show: false }))}
                centered
                size="sm"
            >
                <Modal.Body className="text-center p-4">
                    <div className="mb-3 fs-1">
                        {modalNotif.isSuccess ? '✅' : '❌'}
                    </div>

                    <h5 className="fw-bold mb-2">{modalNotif.title}</h5>
                    <p className="text-muted small mb-4">{modalNotif.message}</p>

                    <Button
                        variant={modalNotif.isSuccess ? 'success' : 'danger'}
                        className="w-100 rounded-pill fw-bold"
                        onClick={() => setModalNotif((prev) => ({ ...prev, show: false }))}
                    >
                        Mengerti
                    </Button>
                </Modal.Body>
            </Modal>

            <div
                className="text-white pb-5"
                style={{
                    background: 'linear-gradient(135deg, #0c2b4d 0%, #123d63 55%, #071d33 100%)',
                    borderBottomLeftRadius: 32,
                    borderBottomRightRadius: 32,
                }}
            >
                <Container className="py-4" style={{ maxWidth: 1180 }}>
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="bg-white rounded-4 shadow-sm p-2 d-flex align-items-center justify-content-center"
                                style={{ width: 58, height: 58 }}
                            >
                                <img
                                    src={PLN_LOGO_URL}
                                    alt="Logo PLN"
                                    style={{
                                        maxWidth: 40,
                                        maxHeight: 40,
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>

                            <div>
                                <div className="small opacity-75 fw-bold">
                                    Detail Pekerjaan 
                                </div>

                                <h3 className="fw-bold mb-1">
                                    {pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                                </h3>

                                <div className="small opacity-75">
                                    {tiket?.nomor_tiket || '-'} • IDPEL {pelanggan?.idpel || pekerjaan?.idpel || '-'}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="light"
                            className="rounded-pill fw-bold px-3"
                            onClick={() => navigate('/dashboard-manajer')}
                        >
                            Kembali
                        </Button>
                    </div>

                    <Row className="g-3">
                        <Col xs={12} md={4}>
                            <div className="rounded-4 p-3 bg-white bg-opacity-10 border border-light border-opacity-10">
                                <div className="small opacity-75 fw-bold">Status</div>
                                <Badge
                                    bg={statusInfo.badge}
                                    text={statusInfo.text}
                                    className="rounded-pill px-3 py-2 mt-2"
                                >
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </Col>

                        <Col xs={12} md={4}>
                            <div className="rounded-4 p-3 bg-white bg-opacity-10 border border-light border-opacity-10">
                                <div className="small opacity-75 fw-bold">Rekomendasi</div>
                                <div className="fs-5 fw-bold mt-1">
                                    {pekerjaan?.rekomendasi || '-'}
                                </div>
                            </div>
                        </Col>

                        <Col xs={12} md={4}>
                            <div className="rounded-4 p-3 bg-white bg-opacity-10 border border-light border-opacity-10">
                                <div className="small opacity-75 fw-bold">Catatan CT</div>
                                <div className="fs-5 fw-bold mt-1">
                                    {pekerjaan?.catatan_ct || '-'}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Container style={{ maxWidth: 1180, marginTop: -36, paddingBottom: 50 }}>
                {!pekerjaan && (
                    <Alert variant="warning" className="rounded-4 shadow-sm border-0">
                        Laporan pekerjaan belum tersedia. Kemungkinan tiket masih berada pada tahap berjalan atau belum diisi petugas.
                    </Alert>
                )}

                <SectionCard
                    title="Informasi Pelanggan & Tiket"
                    subtitle="Data dasar pelanggan, aset APP TR, dan tiket pekerjaan."
                >
                    <Row className="g-3">
                        <InfoItem label="Nama Pelanggan" value={pelanggan?.nama_pelanggan} />
                        <InfoItem label="IDPEL" value={pelanggan?.idpel || pekerjaan?.idpel} />
                        <InfoItem label="Alamat" value={pelanggan?.alamat_pelanggan} />
                        <InfoItem label="Nomor Tiket" value={tiket?.nomor_tiket} />
                        <InfoItem label="Tanggal Tiket" value={formatTanggal(tiket?.tanggal_tiket)} />
                        <InfoItem label="Status Tiket" value={statusInfo.label} />
                        <InfoItem label="Nomor kWh" value={aset?.nomor_kwh} />
                        <InfoItem label="Merek kWh" value={aset?.merek_kwh} />
                        <InfoItem label="Tahun Tera" value={aset?.thtera_kwh} />
                    </Row>
                </SectionCard>

                <SectionCard
                    title="Informasi Petugas"
                    subtitle="Tim dan petugas yang menangani pekerjaan lapangan."
                >
                    <Row className="g-3">
                        <InfoItem label="Tim" value={tiket?.tim?.nama_tim || pekerjaan?.tim?.nama_tim} />
                        <InfoItem label="Petugas" value={pekerjaan?.petugas?.nama_petugas} />
                        <InfoItem label="Tanggal Laporan" value={formatTanggal(pekerjaan?.tanggal)} />
                        <InfoItem label="Jam Laporan" value={pekerjaan?.jam} />
                        <InfoItem label="Pemadaman" value={pekerjaan?.pemadaman} />
                        <InfoItem label="Konstruksi APP" value={pekerjaan?.konstruksi_app} />
                    </Row>
                </SectionCard>

                {pekerjaan && (
                    <>
                        <SectionCard
                            title="Data Pengukuran Primer"
                            subtitle="Data hasil pengukuran sisi primer."
                        >
                            <SimpleTable
                                rows={[
                                    { label: 'Faktor Kali DIL', value: formatAngka(pekerjaan.faktor_kali_dil, 3) },
                                    { label: 'Faktor Kali Real', value: formatAngka(pekerjaan.faktor_kali_real, 3) },
                                    { label: 'Arus Primer R', value: formatAngka(pekerjaan.arus_primer_r_ukur, 3) },
                                    { label: 'Arus Primer S', value: formatAngka(pekerjaan.arus_primer_s_ukur, 3) },
                                    { label: 'Arus Primer T', value: formatAngka(pekerjaan.arus_primer_t_ukur, 3) },
                                    { label: 'Tegangan Primer R', value: formatAngka(pekerjaan.tegangan_primer_r_ukur, 3) },
                                    { label: 'Tegangan Primer S', value: formatAngka(pekerjaan.tegangan_primer_s_ukur, 3) },
                                    { label: 'Tegangan Primer T', value: formatAngka(pekerjaan.tegangan_primer_t_ukur, 3) },
                                    { label: 'Cos Phi Primer', value: formatAngka(pekerjaan.cos_phi_primer, 3) },
                                    { label: 'P Primer R', value: formatAngka(pekerjaan.p_primer_r, 3) },
                                    { label: 'P Primer S', value: formatAngka(pekerjaan.p_primer_s, 3) },
                                    { label: 'P Primer T', value: formatAngka(pekerjaan.p_primer_t, 3) },
                                    { label: 'P Primer Total', value: formatAngka(pekerjaan.p_primer_total, 3) },
                                ]}
                            />
                        </SectionCard>

                        <SectionCard
                            title="Data Pengukuran Sekunder & Meter"
                            subtitle="Data hasil pengukuran sisi sekunder dan meter."
                        >
                            <SimpleTable
                                rows={[
                                    { label: 'Arus Sekunder Ukur R', value: formatAngka(pekerjaan.arus_sekunder_r_ukur, 3) },
                                    { label: 'Arus Sekunder Ukur S', value: formatAngka(pekerjaan.arus_sekunder_s_ukur, 3) },
                                    { label: 'Arus Sekunder Ukur T', value: formatAngka(pekerjaan.arus_sekunder_t_ukur, 3) },
                                    { label: 'Arus Sekunder Meter R', value: formatAngka(pekerjaan.arus_sekunder_r_meter, 3) },
                                    { label: 'Arus Sekunder Meter S', value: formatAngka(pekerjaan.arus_sekunder_s_meter, 3) },
                                    { label: 'Arus Sekunder Meter T', value: formatAngka(pekerjaan.arus_sekunder_t_meter, 3) },
                                    { label: 'Tegangan Meter R', value: formatAngka(pekerjaan.tegangan_meter_r, 3) },
                                    { label: 'Tegangan Meter S', value: formatAngka(pekerjaan.tegangan_meter_s, 3) },
                                    { label: 'Tegangan Meter T', value: formatAngka(pekerjaan.tegangan_meter_t, 3) },
                                    { label: 'Cos Phi Sekunder', value: formatAngka(pekerjaan.cos_phi_sekunder, 3) },
                                    { label: 'P Meter R', value: formatAngka(pekerjaan.p_meter_r, 8) },
                                    { label: 'P Meter S', value: formatAngka(pekerjaan.p_meter_s, 8) },
                                    { label: 'P Meter T', value: formatAngka(pekerjaan.p_meter_t, 8) },
                                    { label: 'P Meter Total', value: formatAngka(pekerjaan.p_meter_total, 8) },
                                ]}
                            />
                        </SectionCard>

                        <SectionCard
                            title="Hasil Analisa Otomatis"
                            subtitle="Ringkasan error, catatan CT, dan rekomendasi hasil pemeriksaan."
                        >
                            <Row className="g-3 mb-3">
                                <Col xs={12} md={6}>
                                    <div className="rounded-4 p-3 bg-light h-100">
                                        <div className="small text-muted fw-bold mb-1">Error kWh Total</div>
                                        <div className="fs-4 fw-bold" style={{ color: PLN_BLUE }}>
                                            {formatPersen(pekerjaan.error_kwh_total)}
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={12} md={6}>
                                    <div className="rounded-4 p-3 bg-light h-100">
                                        <div className="small text-muted fw-bold mb-1">Error CT Total</div>
                                        <div className="fs-4 fw-bold" style={{ color: PLN_BLUE }}>
                                            {formatPersen(pekerjaan.error_ct_total)}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <SimpleTable
                                rows={[
                                    { label: 'Error kWh R', value: formatPersen(pekerjaan.error_kwh_r) },
                                    { label: 'Error kWh S', value: formatPersen(pekerjaan.error_kwh_s) },
                                    { label: 'Error kWh T', value: formatPersen(pekerjaan.error_kwh_t) },
                                    { label: 'Error kWh Total', value: formatPersen(pekerjaan.error_kwh_total) },
                                    { label: 'Error CT R', value: formatPersen(pekerjaan.error_ct_r) },
                                    { label: 'Error CT S', value: formatPersen(pekerjaan.error_ct_s) },
                                    { label: 'Error CT T', value: formatPersen(pekerjaan.error_ct_t) },
                                    { label: 'Error CT Total', value: formatPersen(pekerjaan.error_ct_total) },
                                    { label: 'Catatan CT', value: pekerjaan.catatan_ct },
                                    { label: 'Rekomendasi', value: pekerjaan.rekomendasi },
                                ]}
                            />
                        </SectionCard>

                        <SectionCard
                            title="Pemeriksaan Fisik & Catatan"
                            subtitle="Data tambahan dari hasil pemeriksaan lapangan."
                        >
                            <Row className="g-3">
                                <InfoItem label="Merk Box" value={pekerjaan.merk_box} />
                                <InfoItem label="No Seri Box" value={pekerjaan.no_seri_box} />
                                <InfoItem label="Tahun Box" value={pekerjaan.tahun_box} />
                                <InfoItem label="Kondisi Box / Segel kWh" value={pekerjaan.kondisi_box_segel_kwh} />
                                <InfoItem label="Tikor Baru" value={pekerjaan.tikor_baru} />
                                <InfoItem label="Keterangan" value={pekerjaan.keterangan} />
                                <Col xs={12}>
                                    <div className="bg-light rounded-4 p-3 h-100">
                                        <div className="small text-muted fw-bold mb-1">Catatan Petugas</div>
                                        <div className="fw-semibold text-dark">{pekerjaan.catatan || '-'}</div>
                                    </div>
                                </Col>
                            </Row>
                        </SectionCard>

                        <SectionCard
                            title="Foto Pekerjaan"
                            subtitle="Foto bersifat nullable. Foto kosong tidak dianggap kesalahan."
                        >
                            <Row className="g-3">
                                {FOTO_FIELDS.map((item) => {
                                    const fileId = foto?.[item.key];
                                    const hasFoto = Boolean(fileId);

                                    return (
                                        <Col xs={12} md={6} lg={4} key={item.key}>
                                            <div className="bg-light rounded-4 p-3 h-100 d-flex justify-content-between align-items-center gap-3">
                                                <div>
                                                    <div className="fw-bold small" style={{ color: PLN_BLUE }}>
                                                        {item.label}
                                                    </div>
                                                    <div className="small text-muted">
                                                        {hasFoto ? 'Foto tersedia' : 'Tidak ada foto'}
                                                    </div>
                                                </div>

                                                {hasFoto ? (
                                                    <Button
                                                        as="a"
                                                        href={getDriveViewUrl(fileId)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        size="sm"
                                                        className="rounded-pill fw-bold"
                                                        style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                                    >
                                                        Lihat
                                                    </Button>
                                                ) : (
                                                    <Badge bg="secondary" className="rounded-pill">
                                                        Kosong
                                                    </Badge>
                                                )}
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </SectionCard>

                        <SectionCard
                            title="Validasi Manajer"
                            subtitle="Validasi akhir hanya bisa dilakukan jika status berada pada tahap menunggu validasi."
                        >
                            {tiket?.status === 'menungguValidasi' ? (
                                <div className="d-grid d-md-flex justify-content-md-between align-items-md-center gap-3">
                                    <Alert variant="info" className="mb-0 rounded-4 flex-grow-1">
                                        Pekerjaan ini sudah direview admin dan siap divalidasi manajer.
                                    </Alert>

                                    <Button
                                        size="lg"
                                        className="rounded-pill fw-bold px-4"
                                        style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                        onClick={handleValidasi}
                                        disabled={validating}
                                    >
                                        {validating ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Memvalidasi...
                                            </>
                                        ) : (
                                            'Validasi Selesai'
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <Alert variant="light" className="mb-0 rounded-4 border">
                                    Pekerjaan ini belum berada pada tahap validasi manajer.
                                    Status saat ini: <strong>{statusInfo.label}</strong>.
                                </Alert>
                            )}
                        </SectionCard>
                    </>
                )}
            </Container>
        </div>
    );
}