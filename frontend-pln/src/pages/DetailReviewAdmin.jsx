import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const EDIT_FIELD_GROUPS = [
    {
        title: 'Data Umum',
        fields: [
            { key: 'pemadaman', label: 'Pemadaman' },
            { key: 'konstruksi_app', label: 'Konstruksi APP' },
            { key: 'faktor_kali_dil', label: 'Faktor Kali DIL', type: 'number' },
            { key: 'faktor_kali_real', label: 'Faktor Kali Real', type: 'number' },
        ],
    },
    {
        title: 'Pengukuran Primer',
        fields: [
            { key: 'arus_primer_r_ukur', label: 'Arus Primer R', type: 'number' },
            { key: 'arus_primer_s_ukur', label: 'Arus Primer S', type: 'number' },
            { key: 'arus_primer_t_ukur', label: 'Arus Primer T', type: 'number' },
            { key: 'tegangan_primer_r_ukur', label: 'Tegangan Primer R', type: 'number' },
            { key: 'tegangan_primer_s_ukur', label: 'Tegangan Primer S', type: 'number' },
            { key: 'tegangan_primer_t_ukur', label: 'Tegangan Primer T', type: 'number' },
            { key: 'cos_phi_primer', label: 'Cos Phi Primer', type: 'number' },
            { key: 'p_primer_r', label: 'P Primer R', type: 'number' },
            { key: 'p_primer_s', label: 'P Primer S', type: 'number' },
            { key: 'p_primer_t', label: 'P Primer T', type: 'number' },
            { key: 'p_primer_total', label: 'P Primer Total', type: 'number' },
        ],
    },
    {
        title: 'Pengukuran Sekunder & Meter',
        fields: [
            { key: 'arus_sekunder_r_ukur', label: 'Arus Sekunder Ukur R', type: 'number' },
            { key: 'arus_sekunder_s_ukur', label: 'Arus Sekunder Ukur S', type: 'number' },
            { key: 'arus_sekunder_t_ukur', label: 'Arus Sekunder Ukur T', type: 'number' },
            { key: 'arus_sekunder_r_meter', label: 'Arus Sekunder Meter R', type: 'number' },
            { key: 'arus_sekunder_s_meter', label: 'Arus Sekunder Meter S', type: 'number' },
            { key: 'arus_sekunder_t_meter', label: 'Arus Sekunder Meter T', type: 'number' },
            { key: 'tegangan_meter_r', label: 'Tegangan Meter R', type: 'number' },
            { key: 'tegangan_meter_s', label: 'Tegangan Meter S', type: 'number' },
            { key: 'tegangan_meter_t', label: 'Tegangan Meter T', type: 'number' },
            { key: 'cos_phi_sekunder', label: 'Cos Phi Sekunder', type: 'number' },
        ],
    },
    {
        title: 'Pemeriksaan Fisik & Catatan',
        fields: [
            { key: 'merk_box', label: 'Merk Box' },
            { key: 'no_seri_box', label: 'No Seri Box' },
            { key: 'tahun_box', label: 'Tahun Box' },
            { key: 'kondisi_box_segel_kwh', label: 'Kondisi Box / Segel kWh' },
            { key: 'tikor_baru', label: 'Tikor Baru' },
            { key: 'tanggal', label: 'Tanggal' },
            { key: 'jam', label: 'Jam' },
            { key: 'keterangan', label: 'Keterangan' },
            { key: 'catatan', label: 'Catatan', as: 'textarea' },
        ],
    },
];

const NUMERIC_EDIT_KEYS = new Set(
    EDIT_FIELD_GROUPS
        .flatMap((group) => group.fields)
        .filter((field) => field.type === 'number')
        .map((field) => field.key)
);

function buildEditForm(pekerjaan) {
    const result = {};

    EDIT_FIELD_GROUPS.forEach((group) => {
        group.fields.forEach((field) => {
            result[field.key] = pekerjaan?.[field.key] ?? '';
        });
    });

    return result;
}

function buildPayloadFromEditForm(editForm) {
    const payload = {};

    Object.keys(editForm).forEach((key) => {
        const value = editForm[key];

        if (NUMERIC_EDIT_KEYS.has(key)) {
            payload[key] = value === '' || value === null || value === undefined
                ? null
                : Number(String(value).replace(',', '.'));
        } else {
            payload[key] = value;
        }
    });

    return payload;
}

function getStatusInfo(status) {
    switch (status) {
        case 'inReview':
            return { label: 'Menunggu Review Admin', badge: 'primary', text: undefined };

        case 'menungguValidasi':
            return { label: 'Menunggu Validasi Manajer', badge: 'info', text: 'dark' };

        case 'selesai':
            return { label: 'Selesai', badge: 'success', text: undefined };

        default:
            return { label: status || '-', badge: 'secondary', text: undefined };
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

function formatAngka(value, digit = 3) {
    if (value === null || value === undefined || value === '') return '-';

    const number = Number(value);

    if (Number.isNaN(number)) return value;

    return number.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digit,
    });
}

function formatPersen(value) {
    if (value === null || value === undefined || value === '') return '-';

    const number = Number(value);

    if (Number.isNaN(number)) return value;

    return `${(number * 100).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
}

function getDriveViewUrl(fileId) {
    if (!fileId) return '#';
    return `https://drive.google.com/file/d/${fileId}/view`;
}

function InfoItem({ label, value }) {
    return (
        <Col xs={12} md={6} lg={4}>
            <div className="bg-light rounded-4 p-3 h-100">
                <div className="small text-muted fw-bold mb-1">{label}</div>
                <div className="fw-semibold text-dark">{value || '-'}</div>
            </div>
        </Col>
    );
}

function SectionCard({ title, subtitle, children }) {
    return (
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
}

function SimpleTable({ rows }) {
    return (
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
}

export default function DetailReviewAdmin() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pekerjaan, setPekerjaan] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({});

    const [modalNotif, setModalNotif] = useState({
        show: false,
        title: '',
        message: '',
        isSuccess: true,
    });

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get(`/admin/pekerjaan-review/${id}`);
            const data = response.data.data || response.data;

            setPekerjaan(data);
        } catch (error) {
            console.error('Gagal memuat detail review admin:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Memuat Detail',
                message: error.response?.data?.message || 'Detail review gagal dimuat.',
                isSuccess: false,
            });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleTeruskanKeManajer = async () => {
        try {
            setSubmitting(true);

            await api.post(`/pekerjaan/${id}/review-selesai`);

            setModalNotif({
                show: true,
                title: 'Review Selesai',
                message: 'Laporan berhasil diteruskan ke manajer untuk validasi.',
                isSuccess: true,
            });

            await fetchDetail();
        } catch (error) {
            console.error('Gagal meneruskan review:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Review',
                message: error.response?.data?.message || 'Laporan belum bisa diteruskan ke manajer.',
                isSuccess: false,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = () => {
        setEditForm(buildEditForm(pekerjaan));
        setShowEditModal(true);
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;

        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveEdit = async (event) => {
        event.preventDefault();

        try {
            setSavingEdit(true);

            const payload = buildPayloadFromEditForm(editForm);

            await api.put(`/admin/pekerjaan-review/${id}`, payload);

            setShowEditModal(false);

            setModalNotif({
                show: true,
                title: 'Data Diperbarui',
                message: 'Perubahan laporan berhasil disimpan.',
                isSuccess: true,
            });

            await fetchDetail();
        } catch (error) {
            console.error('Gagal menyimpan perubahan admin:', error.response?.data || error);

            setModalNotif({
                show: true,
                title: 'Gagal Menyimpan',
                message: error.response?.data?.message || 'Perubahan laporan gagal disimpan.',
                isSuccess: false,
            });
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <Spinner animation="border" style={{ color: PLN_BLUE }} />
                    <div className="small text-muted mt-2">
                        Memuat detail review admin...
                    </div>
                </div>
            </div>
        );
    }

    const tiket = pekerjaan?.tiket;
    const aset = tiket?.aset;
    const pelanggan = aset?.pelanggan;
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

                    <h5 className="fw-bold mb-2">
                        {modalNotif.title}
                    </h5>

                    <p className="text-muted small mb-4">
                        {modalNotif.message}
                    </p>

                    <Button
                        variant={modalNotif.isSuccess ? 'success' : 'danger'}
                        className="w-100 rounded-pill fw-bold"
                        onClick={() => setModalNotif((prev) => ({ ...prev, show: false }))}
                    >
                        Mengerti
                    </Button>
                </Modal.Body>
            </Modal>

            <Modal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                centered
                size="xl"
            >
                <Form onSubmit={handleSaveEdit}>
                    <Modal.Header closeButton>
                        <Modal.Title className="fw-bold" style={{ color: PLN_BLUE }}>
                            Edit Laporan Review Admin
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                        {EDIT_FIELD_GROUPS.map((group) => (
                            <Card className="border-0 bg-light rounded-4 mb-3" key={group.title}>
                                <Card.Body>
                                    <h6 className="fw-bold mb-3" style={{ color: PLN_BLUE }}>
                                        {group.title}
                                    </h6>

                                    <Row className="g-3">
                                        {group.fields.map((field) => (
                                            <Col xs={12} md={field.as === 'textarea' ? 12 : 6} lg={field.as === 'textarea' ? 12 : 4} key={field.key}>
                                                <Form.Group>
                                                    <Form.Label className="fw-semibold small">
                                                        {field.label}
                                                    </Form.Label>

                                                    <Form.Control
                                                        as={field.as === 'textarea' ? 'textarea' : 'input'}
                                                        rows={field.as === 'textarea' ? 3 : undefined}
                                                        type={field.type === 'number' ? 'number' : 'text'}
                                                        step={field.type === 'number' ? '0.000001' : undefined}
                                                        name={field.key}
                                                        value={editForm[field.key] ?? ''}
                                                        onChange={handleEditChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}

                        <Alert variant="warning" className="rounded-4 mb-0">
                            Perubahan ini hanya bisa dilakukan selama status masih <strong>Menunggu Review Admin</strong>.
                            Setelah diteruskan ke manajer, data tidak bisa diedit dari halaman ini.
                        </Alert>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="light"
                            className="rounded-pill fw-bold px-4 border"
                            onClick={() => setShowEditModal(false)}
                            disabled={savingEdit}
                        >
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            className="rounded-pill fw-bold px-4"
                            style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                            disabled={savingEdit}
                        >
                            {savingEdit ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Perubahan'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
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
                                    Detail Review Admin
                                </div>

                                <h3 className="fw-bold mb-1">
                                    {pelanggan?.nama_pelanggan || 'Tanpa Nama'}
                                </h3>

                                <div className="small opacity-75">
                                    {tiket?.nomor_tiket || '-'} • IDPEL {pelanggan?.idpel || pekerjaan?.idpel || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            {tiket?.status === 'inReview' && (
                                <Button
                                    variant="warning"
                                    className="rounded-pill fw-bold px-3"
                                    onClick={openEditModal}
                                >
                                    Edit Laporan
                                </Button>
                            )}

                            <Button
                                variant="light"
                                className="rounded-pill fw-bold px-3"
                                onClick={() => navigate('/dashboard-admin')}
                            >
                                Kembali
                            </Button>
                        </div>
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
                <SectionCard
                    title="Informasi Pelanggan & Tiket"
                    subtitle="Data pelanggan, aset APP TR, dan tiket pekerjaan."
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
                    subtitle="Tim dan petugas yang mengisi laporan lapangan."
                >
                    <Row className="g-3">
                        <InfoItem label="Tim" value={pekerjaan?.tim?.nama_tim || pekerjaan?.tim?.nama} />
                        <InfoItem label="Petugas" value={pekerjaan?.petugas?.nama_petugas} />
                        <InfoItem label="Tanggal Laporan" value={formatTanggal(pekerjaan?.tanggal)} />
                        <InfoItem label="Jam Laporan" value={pekerjaan?.jam} />
                        <InfoItem label="Pemadaman" value={pekerjaan?.pemadaman} />
                        <InfoItem label="Konstruksi APP" value={pekerjaan?.konstruksi_app} />
                    </Row>
                </SectionCard>

                <SectionCard
                    title="Data Pengukuran Primer"
                    subtitle="Data hasil pengukuran sisi primer."
                >
                    <SimpleTable
                        rows={[
                            { label: 'Faktor Kali DIL', value: formatAngka(pekerjaan?.faktor_kali_dil, 3) },
                            { label: 'Faktor Kali Real', value: formatAngka(pekerjaan?.faktor_kali_real, 3) },
                            { label: 'Arus Primer R', value: formatAngka(pekerjaan?.arus_primer_r_ukur, 3) },
                            { label: 'Arus Primer S', value: formatAngka(pekerjaan?.arus_primer_s_ukur, 3) },
                            { label: 'Arus Primer T', value: formatAngka(pekerjaan?.arus_primer_t_ukur, 3) },
                            { label: 'Tegangan Primer R', value: formatAngka(pekerjaan?.tegangan_primer_r_ukur, 3) },
                            { label: 'Tegangan Primer S', value: formatAngka(pekerjaan?.tegangan_primer_s_ukur, 3) },
                            { label: 'Tegangan Primer T', value: formatAngka(pekerjaan?.tegangan_primer_t_ukur, 3) },
                            { label: 'Cos Phi Primer', value: formatAngka(pekerjaan?.cos_phi_primer, 3) },
                            { label: 'P Primer R', value: formatAngka(pekerjaan?.p_primer_r, 3) },
                            { label: 'P Primer S', value: formatAngka(pekerjaan?.p_primer_s, 3) },
                            { label: 'P Primer T', value: formatAngka(pekerjaan?.p_primer_t, 3) },
                            { label: 'P Primer Total', value: formatAngka(pekerjaan?.p_primer_total, 3) },
                        ]}
                    />
                </SectionCard>

                <SectionCard
                    title="Data Pengukuran Sekunder & Meter"
                    subtitle="Data hasil pengukuran sisi sekunder dan meter."
                >
                    <SimpleTable
                        rows={[
                            { label: 'Arus Sekunder Ukur R', value: formatAngka(pekerjaan?.arus_sekunder_r_ukur, 3) },
                            { label: 'Arus Sekunder Ukur S', value: formatAngka(pekerjaan?.arus_sekunder_s_ukur, 3) },
                            { label: 'Arus Sekunder Ukur T', value: formatAngka(pekerjaan?.arus_sekunder_t_ukur, 3) },
                            { label: 'Arus Sekunder Meter R', value: formatAngka(pekerjaan?.arus_sekunder_r_meter, 3) },
                            { label: 'Arus Sekunder Meter S', value: formatAngka(pekerjaan?.arus_sekunder_s_meter, 3) },
                            { label: 'Arus Sekunder Meter T', value: formatAngka(pekerjaan?.arus_sekunder_t_meter, 3) },
                            { label: 'Tegangan Meter R', value: formatAngka(pekerjaan?.tegangan_meter_r, 3) },
                            { label: 'Tegangan Meter S', value: formatAngka(pekerjaan?.tegangan_meter_s, 3) },
                            { label: 'Tegangan Meter T', value: formatAngka(pekerjaan?.tegangan_meter_t, 3) },
                            { label: 'Cos Phi Sekunder', value: formatAngka(pekerjaan?.cos_phi_sekunder, 3) },
                            { label: 'P Meter R', value: formatAngka(pekerjaan?.p_meter_r, 8) },
                            { label: 'P Meter S', value: formatAngka(pekerjaan?.p_meter_s, 8) },
                            { label: 'P Meter T', value: formatAngka(pekerjaan?.p_meter_t, 8) },
                            { label: 'P Meter Total', value: formatAngka(pekerjaan?.p_meter_total, 8) },
                        ]}
                    />
                </SectionCard>

                <SectionCard
                    title="Hasil Analisa Otomatis"
                    subtitle="Ringkasan error kWh, error CT, dan rekomendasi."
                >
                    <Row className="g-3 mb-3">
                        <Col xs={12} md={6}>
                            <div className="rounded-4 p-3 bg-light h-100">
                                <div className="small text-muted fw-bold mb-1">Error kWh Total</div>
                                <div className="fs-4 fw-bold" style={{ color: PLN_BLUE }}>
                                    {formatPersen(pekerjaan?.error_kwh_total)}
                                </div>
                            </div>
                        </Col>

                        <Col xs={12} md={6}>
                            <div className="rounded-4 p-3 bg-light h-100">
                                <div className="small text-muted fw-bold mb-1">Error CT Total</div>
                                <div className="fs-4 fw-bold" style={{ color: PLN_BLUE }}>
                                    {formatPersen(pekerjaan?.error_ct_total)}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <SimpleTable
                        rows={[
                            { label: 'Error kWh R', value: formatPersen(pekerjaan?.error_kwh_r) },
                            { label: 'Error kWh S', value: formatPersen(pekerjaan?.error_kwh_s) },
                            { label: 'Error kWh T', value: formatPersen(pekerjaan?.error_kwh_t) },
                            { label: 'Error kWh Total', value: formatPersen(pekerjaan?.error_kwh_total) },
                            { label: 'Error CT R', value: formatPersen(pekerjaan?.error_ct_r) },
                            { label: 'Error CT S', value: formatPersen(pekerjaan?.error_ct_s) },
                            { label: 'Error CT T', value: formatPersen(pekerjaan?.error_ct_t) },
                            { label: 'Error CT Total', value: formatPersen(pekerjaan?.error_ct_total) },
                            { label: 'Catatan CT', value: pekerjaan?.catatan_ct },
                            { label: 'Rekomendasi', value: pekerjaan?.rekomendasi },
                        ]}
                    />
                </SectionCard>

                <SectionCard
                    title="Pemeriksaan Fisik & Catatan"
                    subtitle="Data tambahan pemeriksaan dari petugas."
                >
                    <Row className="g-3">
                        <InfoItem label="Merk Box" value={pekerjaan?.merk_box} />
                        <InfoItem label="No Seri Box" value={pekerjaan?.no_seri_box} />
                        <InfoItem label="Tahun Box" value={pekerjaan?.tahun_box} />
                        <InfoItem label="Kondisi Box / Segel kWh" value={pekerjaan?.kondisi_box_segel_kwh} />
                        <InfoItem label="Tikor Baru" value={pekerjaan?.tikor_baru} />
                        <InfoItem label="Keterangan" value={pekerjaan?.keterangan} />

                        <Col xs={12}>
                            <div className="bg-light rounded-4 p-3 h-100">
                                <div className="small text-muted fw-bold mb-1">
                                    Catatan Petugas
                                </div>

                                <div className="fw-semibold text-dark">
                                    {pekerjaan?.catatan || '-'}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </SectionCard>

                <SectionCard
                    title="Foto Pekerjaan"
                    subtitle="Foto boleh kosong. Admin cukup memeriksa foto yang tersedia."
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
                    title="Aksi Review Admin"
                    subtitle="Jika laporan sudah benar, teruskan pekerjaan ke manajer untuk validasi akhir."
                >
                    {tiket?.status === 'inReview' ? (
                        <div className="d-grid d-md-flex justify-content-md-between align-items-md-center gap-3">
                            <Alert variant="primary" className="mb-0 rounded-4 flex-grow-1">
                                Laporan ini sedang menunggu review admin. Pastikan data dan foto sudah diperiksa sebelum diteruskan.
                            </Alert>

                            <Button
                                size="lg"
                                className="rounded-pill fw-bold px-4"
                                style={{ backgroundColor: PLN_BLUE, border: 'none' }}
                                onClick={handleTeruskanKeManajer}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Memproses...
                                    </>
                                ) : (
                                    'Teruskan ke Manajer'
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Alert variant="light" className="mb-0 rounded-4 border">
                            Laporan ini tidak berada pada tahap review admin.
                            Status saat ini: <strong>{statusInfo.label}</strong>.
                        </Alert>
                    )}
                </SectionCard>
            </Container>
        </div>
    );
}