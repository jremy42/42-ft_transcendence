import React, { FC, ReactElement, createContext, useContext, useState } from 'react'

import { AppBar, Box, Container, Grid, Typography, autocompleteClasses } from '@mui/material'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'

const CustomLink = styled(Link)
    ({
        textDecoration: 'none',
        color: 'white',
        '&:hover': {
            textDecoration: 'none',
            color: 'white',
        }
    })

export function Footer() {
    return (

            <Container maxWidth="lg" sx={{ bg: 'primary.main' }}>
                <Grid container direction="column" alignItems="center">
                    <Grid item xs={12}>
                        <Typography color="white" variant="subtitle1">
                            {`${new Date().getFullYear()} | Made with ❤️ by `}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CustomLink to="https://github.com/fleblay" target="_blank"> Fleblay </CustomLink>
                        <CustomLink to="https://github.com/ImHoppy" target="_blank"> Mbraets </CustomLink>
                        <CustomLink to="https://github.com/jremy42" target="_blank"> Jremy </CustomLink>
                    </Grid>
                </Grid>
            </Container>
    )
}
