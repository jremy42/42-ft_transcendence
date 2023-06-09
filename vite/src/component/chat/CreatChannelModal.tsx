import { Alert, Box, Button, Container, CssBaseline, Divider, FormControl, FormControlLabel, FormLabel, Grid, Input, Modal, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import React, { FormEvent, useState } from "react";
import apiClient from "../../auth/interceptor.axios";
import { useNavigate } from "react-router-dom";

export function CreateChannelModal({ openCreateChannel, handleClose }: { openCreateChannel: boolean, handleClose: () => void }) {

    const [channelType, setChannelType] = React.useState('public');
    const navigate = useNavigate();
    const [error, setError] = useState<string>("")


    const handleChangeChannelType = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChannelType((event.target as HTMLInputElement).value);
    };


    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const ChannelForm = new FormData(event.currentTarget);


        const name = ChannelForm.get('name') as string;
        if (name.length < 1 || name.length > 15) {
            setError("Name must be between 1 and 15 characters")
            return
        }

        const channelParams = {
            name: ChannelForm.get("name") as string,
            private: (channelType === 'private') ? true : false,
            password: (channelType === 'protected') ? ChannelForm.get("password") as string : ""
        }
        apiClient.post(`/api/chat/channels/create`, channelParams).then((response) => {

            handleClose();
            setError("");
            navigate(`/chat/${response.data}`);
        }
        ).catch((error) => {});
    };

    return (
        <Modal open={openCreateChannel} onClose={handleClose} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                    p: '3rem'
                }}>
                    <Typography textAlign="center" variant="h6" sx={{ flexGrow: 1, mb: '10px' }} > create channel</Typography>
                    <Divider />
                    <form onSubmit={handleSubmit}>

                        <TextField required fullWidth label="name" type="name" name="name" sx={{ flexGrow: 1, }} />
                        <FormControl sx={{ p: '1rem' }}>
                            <RadioGroup
                                defaultValue="public"
                                name="radio-buttons-group"
                                value={channelType}
                                onChange={handleChangeChannelType}
                            >
                                <FormControlLabel value="public" control={<Radio />} label="Public" />
                                <FormControlLabel value="private" control={<Radio />} label="Private" />
                                <FormControlLabel value="protected" control={<Radio />} label="Protected" />
                            </RadioGroup>
                            {(channelType === 'protected') ? <TextField required size="small" fullWidth label="password" type="password" name="password" sx={{ mt: '10px' }} /> : null}
                        </FormControl>
                        <Button variant="outlined" type='submit' sx={{ flexGrow: 1, mt: '10px', width: '100%', height: '30px' }}>Create</Button>
                        <Divider />
                    </form>
                    <Button onClick={handleClose}>Close</Button>
                    { error && <Alert severity="warning">{error}</Alert>}

                </Box>
            </Container>
        </Modal>
    )
}