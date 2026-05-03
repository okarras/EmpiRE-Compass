import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Refresh,
  Add,
  Edit,
  Delete,
  Group as TeamIcon,
  Close,
} from '@mui/icons-material';
import CRUDTeam, { TeamMember, TeamMemberInput } from '../firestore/CRUDTeam';
import { useAuth } from '../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U4NjE2MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

interface EditingMember extends TeamMemberInput {
  id?: string;
}

const AdminTeam = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditingMember | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const members = await CRUDTeam.getTeamMembers();
      const sortedMembers = [...members].sort((a, b) => {
        const priorityA = a.priority ?? 999;
        const priorityB = b.priority ?? 999;
        return priorityA - priorityB;
      });
      setTeamMembers(sortedMembers);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember({
        id: member.id,
        name: member.name,
        role: member.role || '',
        description: member.description,
        image: member.image,
        email: member.email,
        link: member.link || '',
        priority: member.priority ?? 999,
      });
    } else {
      setEditingMember({
        name: '',
        role: '',
        description: '',
        image: '',
        email: '',
        link: '',
        priority: 999,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
  };

  const handleSaveMember = async () => {
    if (!editingMember || !user) return;

    if (!editingMember.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!editingMember.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSaving(true);
      const memberData: TeamMemberInput = {
        name: editingMember.name.trim(),
        role: editingMember.role?.trim() || undefined,
        description: editingMember.description?.trim() || '',
        image: editingMember.image?.trim() || '',
        email: editingMember.email.trim(),
        link: editingMember.link?.trim() || undefined,
        priority: editingMember.priority ?? 999,
      };

      if (editingMember.id) {
        await CRUDTeam.updateTeamMember(
          editingMember.id,
          memberData,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Team member updated successfully!');
      } else {
        await CRUDTeam.createTeamMember(
          memberData,
          user.id,
          user.email,
          keycloak?.token
        );
        setSuccess('Team member added successfully!');
      }

      handleCloseDialog();
      await loadTeamMembers();
    } catch (err) {
      console.error('Error saving team member:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to save team member'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !user) return;

    try {
      setSaving(true);
      await CRUDTeam.deleteTeamMember(
        memberToDelete.id,
        user.id,
        user.email,
        keycloak?.token
      );
      setSuccess('Team member deleted successfully!');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      await loadTeamMembers();
    } catch (err) {
      console.error('Error deleting team member:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete team member'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const updateEditingMember = (
    field: keyof EditingMember,
    value: string | number
  ) => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
      >
        <CircularProgress sx={{ color: '#e86161' }} />
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
            <TeamIcon sx={{ fontSize: 40, color: '#e86161' }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{ color: '#e86161', fontWeight: 700 }}
              >
                Team Member Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Manage team members displayed on the team page
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadTeamMembers}
                disabled={saving}
              >
                Reload
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: '#e86161',
                  '&:hover': { backgroundColor: '#d45151' },
                }}
              >
                Add Member
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box>
            {teamMembers.length === 0 ? (
              <Alert severity="info">
                No team members found. Click "Add Member" to create your first
                team member.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {teamMembers.map((member) => (
                  <Paper key={member.id} elevation={1} sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 3,
                        flexDirection: { xs: 'column', md: 'row' },
                      }}
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        <img
                          src={member.image || PLACEHOLDER_IMAGE}
                          alt={member.name}
                          style={{
                            width: '150px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== PLACEHOLDER_IMAGE) {
                              target.src = PLACEHOLDER_IMAGE;
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {member.name}
                            </Typography>
                            {member.role && (
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: '#e86161',
                                  fontWeight: 500,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {member.role}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => handleOpenDialog(member)}
                              color="primary"
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteClick(member)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', mb: 1 }}
                        >
                          {member.description}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Email:</strong> {member.email}
                        </Typography>
                        {member.link && (
                          <Typography variant="body2">
                            <strong>Link:</strong>{' '}
                            <a
                              href={member.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#e86161' }}
                            >
                              {member.link}
                            </a>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Paper>

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">
                {editingMember?.id ? 'Edit Team Member' : 'Add Team Member'}
              </Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {editingMember && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editingMember.image && (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Image Preview
                    </Typography>
                    <img
                      src={editingMember.image || PLACEHOLDER_IMAGE}
                      alt="Preview"
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== PLACEHOLDER_IMAGE) {
                          target.src = PLACEHOLDER_IMAGE;
                        }
                      }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Name *"
                  value={editingMember.name}
                  onChange={(e) => updateEditingMember('name', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  label="Role"
                  value={editingMember.role}
                  onChange={(e) => updateEditingMember('role', e.target.value)}
                  helperText="e.g., Project Lead, Researcher, Developer"
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={editingMember.description}
                  onChange={(e) =>
                    updateEditingMember('description', e.target.value)
                  }
                  multiline
                  rows={4}
                />

                <TextField
                  fullWidth
                  label="Image URL"
                  value={editingMember.image}
                  onChange={(e) => updateEditingMember('image', e.target.value)}
                  helperText="Full URL to the team member's image"
                />

                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => updateEditingMember('email', e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  label="Link"
                  value={editingMember.link}
                  onChange={(e) => updateEditingMember('link', e.target.value)}
                  helperText="Optional: Personal website, profile, or social media link"
                />

                <TextField
                  fullWidth
                  label="Priority"
                  type="number"
                  value={editingMember.priority}
                  onChange={(e) => {
                    const priority = Number.parseInt(e.target.value, 10);
                    updateEditingMember(
                      'priority',
                      Number.isNaN(priority) ? 999 : priority
                    );
                  }}
                  helperText="Lower numbers appear first (default: 999)"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSaveMember}
              disabled={saving}
              sx={{
                backgroundColor: '#e86161',
                '&:hover': { backgroundColor: '#d45151' },
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{' '}
              <strong>{memberToDelete?.name}</strong>? This action cannot be
              undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Delete />}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSuccess(null)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default AdminTeam;
