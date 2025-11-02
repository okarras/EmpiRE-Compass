import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  People,
  Storage,
  Description,
  Assessment,
  Refresh,
  AdminPanelSettings,
  CheckCircle,
  Cancel,
  Backup,
  DataObject,
  MonitorHeart,
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

interface FirebaseUser {
  id: string;
  display_name?: string;
  email?: string;
  is_admin?: boolean;
  orcid?: string;
  created_at?: Timestamp;
  last_login?: Timestamp;
}

interface TemplateStats {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  statisticsCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [templates, setTemplates] = useState<TemplateStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalStatistics, setTotalStatistics] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Users
      const usersSnapshot = await getDocs(
        query(collection(db, 'Users'), orderBy('created_at', 'desc'), limit(50))
      );
      const usersData: FirebaseUser[] = [];
      usersSnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as FirebaseUser);
      });
      setUsers(usersData);
      setTotalUsers(usersData.length);
      setTotalAdmins(usersData.filter((u) => u.is_admin).length);

      // Fetch Templates and their subcollections
      const templatesSnapshot = await getDocs(collection(db, 'Templates'));
      const templatesData: TemplateStats[] = [];
      let questionsTotal = 0;
      let statisticsTotal = 0;

      for (const templateDoc of templatesSnapshot.docs) {
        const templateData = templateDoc.data();

        // Count questions
        const questionsSnapshot = await getDocs(
          collection(db, `Templates/${templateDoc.id}/Questions`)
        );
        const questionsCount = questionsSnapshot.size;
        questionsTotal += questionsCount;

        // Count statistics
        const statisticsSnapshot = await getDocs(
          collection(db, `Templates/${templateDoc.id}/Statistics`)
        );
        const statisticsCount = statisticsSnapshot.size;
        statisticsTotal += statisticsCount;

        templatesData.push({
          id: templateDoc.id,
          title: templateData.title || templateDoc.id,
          description: templateData.description || '',
          questionsCount,
          statisticsCount,
        });
      }

      setTemplates(templatesData);
      setTotalQuestions(questionsTotal);
      setTotalStatistics(statisticsTotal);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(
        'Failed to load dashboard data. Please check Firebase permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      return new Date(timestamp.toDate()).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading admin dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminPanelSettings sx={{ fontSize: 40, color: '#e86161' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System overview and user management
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={fetchDashboardData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ height: '100%', backgroundColor: 'rgba(76, 114, 176, 0.05)' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Total Users
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: '#4c72b0' }}
                  >
                    {totalUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Badge badgeContent={totalAdmins} color="error">
                  <People
                    sx={{ fontSize: 48, color: '#4c72b0', opacity: 0.3 }}
                  />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ height: '100%', backgroundColor: 'rgba(232, 97, 97, 0.05)' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Templates
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: '#e86161' }}
                  >
                    {templates.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active templates
                  </Typography>
                </Box>
                <Storage
                  sx={{ fontSize: 48, color: '#e86161', opacity: 0.3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ height: '100%', backgroundColor: 'rgba(85, 168, 104, 0.05)' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Questions
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: '#55a868' }}
                  >
                    {totalQuestions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across all templates
                  </Typography>
                </Box>
                <Description
                  sx={{ fontSize: 48, color: '#55a868', opacity: 0.3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ height: '100%', backgroundColor: 'rgba(221, 132, 82, 0.05)' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Statistics
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: '#dd8452' }}
                  >
                    {totalStatistics}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across all templates
                  </Typography>
                </Box>
                <Assessment
                  sx={{ fontSize: 48, color: '#dd8452', opacity: 0.3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ mb: 4, p: 2, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          🚀 Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/${templateId}/admin/data`)}
            >
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <DataObject color="primary" />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Data Management
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage questions & statistics
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/${templateId}/admin/backup`)}
            >
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Backup color="secondary" />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Backup & Restore
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Export/import Firebase data
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/${templateId}/admin/request-monitor`)}
            >
              <CardContent
                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <MonitorHeart sx={{ color: '#1976d2' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Request Monitor
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Track Firebase requests
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={`Users (${totalUsers})`}
            icon={<People />}
            iconPosition="start"
          />
          <Tab
            label={`Templates (${templates.length})`}
            icon={<Storage />}
            iconPosition="start"
          />
        </Tabs>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>ORCID</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Last Login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: user.is_admin ? '#e86161' : '#4c72b0',
                            }}
                          >
                            {user.display_name?.charAt(0).toUpperCase() ||
                              user.email?.charAt(0).toUpperCase() ||
                              '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.display_name || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        >
                          {user.email || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.orcid ? (
                          <Chip
                            label={user.orcid}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Chip
                            icon={<CheckCircle />}
                            label="Admin"
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Chip
                            icon={<Cancel />}
                            label="User"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(user.created_at ?? new Timestamp(0, 0))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(user.last_login ?? new Timestamp(0, 0))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {templates.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">No templates found in Firebase</Alert>
              </Grid>
            ) : (
              templates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {template.title}
                          </Typography>
                          <Chip
                            label={template.id}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Storage color="action" />
                      </Box>

                      {template.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {template.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box
                          sx={{
                            flex: 1,
                            textAlign: 'center',
                            p: 1,
                            backgroundColor: 'rgba(85, 168, 104, 0.1)',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 600, color: '#55a868' }}
                          >
                            {template.questionsCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Questions
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            textAlign: 'center',
                            p: 1,
                            backgroundColor: 'rgba(221, 132, 82, 0.1)',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 600, color: '#dd8452' }}
                          >
                            {template.statisticsCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Statistics
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
