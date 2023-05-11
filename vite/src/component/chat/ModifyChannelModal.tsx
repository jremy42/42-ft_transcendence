
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useState } from 'react';
import { ChannelInfo } from '../../types';
import apiClient from '../../auth/interceptor.axios';
import { Box, Button, Container, Divider, FormControl, IconButton, Input, InputAdornment, InputLabel, Modal, TextField, Typography } from '@mui/material';

export const ModifyChannelModal: React.FC<{ channelInfo: ChannelInfo | null, open: boolean, handleClose: () => void }> = ({ channelInfo, open, handleClose }) => {
	const [error, setError] = useState<string | null>(null);

	const [memberInvite, setMemberInvite] = useState<string>("");

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const channelForm = new FormData(event.currentTarget);

		apiClient.post(`/api/chat/channels/${channelInfo?.id}/info`, {
			name: channelForm.get('name'),
			password: channelForm.get('password') || ''
		}).then(() => {
			handleClose()
		}).catch((err) => {
			setError(err.response.data.message)
		})
	}
	function handleInviteMember() {
		if (memberInvite.length < 3) return;
		apiClient.post(`/api/chat/channels/${channelInfo?.id}/join`, {
			username: memberInvite
		}).then(() => {
			setMemberInvite("")
		}).catch((err) => {
			setError(err.response.data.message)
		})
	}
	return (
		<Modal open={open} onClose={handleClose} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Container maxWidth="sm" className="centered-container" >
				<Box sx={{
					width: '100%',
					border: '1px solid #D3C6C6',
					boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
					borderRadius: '16px',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					bgcolor: 'background.paper',
					p: '1rem'
				}}>
					<Typography textAlign="center" variant="h6" sx={{ flexGrow: 1, mb: '10px' }} >
						Modify Channel
					</Typography>
					<Divider />
					{error
						&& <Typography textAlign="center" variant="h6" sx={{ flexGrow: 1, mb: '10px' }} >
							{error}
						</Typography>
					}

					<form onSubmit={handleSubmit} style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
						<TextField required label="name" type="name" name="name" defaultValue={channelInfo?.name} sx={{ flexGrow: 1, }} />
						{!channelInfo?.private && <TextField label="Password" type="password" name="password" sx={{ flexGrow: 1, }} />}
						<Button variant="outlined" type='submit' sx={{ flexGrow: 1, mt: '10px', width: '100%', height: '30px' }}>
							Modify
						</Button>
					</form>

					{
						channelInfo?.private
						&& <FormControl sx={{ m: 1, width: '25ch' }} variant="standard">
							<InputLabel>Invite members</InputLabel>
							<Input
								type='text'
								value={memberInvite}
								onChange={(e) => setMemberInvite(e.target.value)}
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											onClick={handleInviteMember}
										>
											<PersonAddIcon />
										</IconButton>
									</InputAdornment>
								}
							/>
						</FormControl>

					}
					<Button onClick={handleClose}>Close</Button>
				</Box>
			</Container>
		</Modal>
	);
}