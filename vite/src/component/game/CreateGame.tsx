import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Checkbox, Divider, Icon, IconButton, Slider, Stack, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../socket/SocketProvider';
import { GameOptions } from '../../types';
import { ListCurrentGames } from './ListCurrentGames';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrivateImage from '../../assets/private.png';
import PublicImage from '../../assets/public.png';
import { KeyboardArrowDown, KeyboardArrowUp, KeyboardArrowRight } from '@mui/icons-material';

export function CreateGame() {
	const navigate = useNavigate();
	const { customEmit } = React.useContext(SocketContext);

	const [advanced, setAdvanced] = useState<boolean>(false);

	const [privateGame, setPrivateGame] = useState<boolean>(false);
	const [obstacles, setObsctacles] = useState<boolean>(true);
	const [shoot, setShoot] = useState<boolean>(true);
	const [ballSpeed, setballSpeed] = useState<number>(1.3);
	const [victoryRounds, setVictoryRounds] = useState<number>(5);
	const [paddleReduce, setPaddleReduce] = useState<number>(1);
	const [paddleLen, setPaddleLen] = useState<number[]>([80, 160])

	const [maxBounce, setMaxBounce] = useState<number>(5);
	const [startAmo, setStartAmo] = useState<number>(3);
	const [ballSize, setBallSize] = useState<number>(5);
	const [playerSpeed, setPlayerSpeed] = useState<number>(3);
	const [shootSpeed, setShootSpeed] = useState<number>(1.5);
	const [shootSize, setShootSize] = useState<number>(2);
	const [liftEffect, setLiftEffect] = useState<number>(1);

	function handlePaddleLenChange(event: Event, val: number | number[], thumb: number) {
		const minDist = 50
		if (!Array.isArray(val))
			return
		if (val[1] - val[0] < minDist) {
			if (thumb == 0) {
				if (val[0] + minDist <= 480)
					setPaddleLen([val[0], val[0] + minDist])
				else
					setPaddleLen([480 - minDist, 480])
			}
			else {
				if (val[1] - minDist >= 0)
					setPaddleLen([val[1] - minDist, val[1]])
				else
					setPaddleLen([0, minDist])
			}
		}
		else {
			setPaddleLen(val)
		}
	}

	function setPrivateAndAdvanced() {
		setPrivateGame(true)
		setAdvanced(true)
	}


	function joinGame(options: GameOptions, gameId?: string) {
		if (gameId) {
			navigate(`/game/${gameId}`);
		}
		else {
			customEmit(privateGame ? 'game.create' : 'game.findOrCreate', { options }, (gameId: string) => {
				navigate(`/game/${gameId}`);
			});
		}
	}

	return (
		<Box sx={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
		}}>
			{!advanced &&
				<>
					<Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', margin: theme => `${theme.spacing(4)} 0` }}>
						<Typography paddingBottom={2} color='primary' variant="h3">Let's Play !</Typography>
					</Box>
					<Box >
						<Typography color='primary' sx={{ display: 'flex', alignItems: 'center' }} variant="h6" textAlign={'center'}>
							Controls: <KeyboardArrowUp /> <KeyboardArrowDown />
						</Typography>
					</Box>
					<Box sx={{
						width: '100%',
						display: 'flex',
						flexDirection: { xs: 'column', lg: 'row' },
						alignItems: 'center',
						justifyContent: 'center'
					}}>
						<Card sx={{ maxWidth: 600, padding: 3, margin: 2 }}>
							<CardMedia
								component="img"
								height="240"
								image={PublicImage}
							/>
							<CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
								<Button variant='contained' onClick={() => {
									joinGame({})
								}}>
									join game
								</Button>

							</CardContent>
						</Card>
						<Card sx={{ maxWidth: 600, padding: 3, margin: 2 }}>
							<CardMedia
								component="img"
								height="240"
								image={PrivateImage}
							/>
							<CardContent sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
								<Button variant='contained' onClick={() => {
									setPrivateAndAdvanced()
								}}>
									create private custom game
								</Button>

							</CardContent>
						</Card>

					</Box>

				</>
			}
			{advanced &&
				<Box sx={{
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					margin: theme => `${theme.spacing(4)} 0`,
				}}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							margin: (theme) => `${theme.spacing(4)} 0`,
							position: 'relative'
						}}
					>
						<IconButton sx={{ position: 'absolute', left: 0 }} onClick={() => setAdvanced(false)} color="primary" aria-label="back">
							<ArrowBackIcon /> Back
						</IconButton>
						<Typography color='primary' variant="h4">Pimp my pong</Typography>

					</Box>
					<Button variant='contained'
						sx={{ marginY: 2 }}
						onClick={() => {
							joinGame({ obstacles, shoot, ballSpeed, victoryRounds, paddleReduce, paddleLength: paddleLen[1], paddleLengthMin: paddleLen[0], maxBounce, startAmo, ballSize, playerSpeed, shootSize, shootSpeed, liftEffect })
						}}
					>
						{privateGame ? "Create a private game" : "Join a game"}
					</Button>
					<Divider sx={{ width: '100%' }} />
					<Typography color='primary' variant="h5">Choose your parameters !</Typography>
					<Box sx={{
						display: advanced ? 'flex' : 'none',
						width: '50%',
						flexDirection: 'column',
						alignItems: 'center',
						'& > *': {
							width: '100%',
							margin: (theme) => `${theme.spacing(2)} 0`,
						},
					}}>
						<Stack direction="row" spacing={2} justifyContent={'center'}>
							<Tooltip title="Add some obstacles to spice up the game!">
								<Button onClick={(e) => { setObsctacles((obstacles) => !obstacles) }} size='large' sx={{ fontWeight: 900, color: obstacles ? undefined : 'grey' }}>Obstacles</Button>
							</Tooltip>
							<Tooltip title="Shoot at your opponent with Right Arrow">
								<Button onClick={(e) => { setShoot((shoot) => !shoot) }} size='large' sx={{ fontWeight: 900, color: shoot ? undefined : 'grey' }}>Shoot</Button>
							</Tooltip>
							<Tooltip title="Shrink the paddle length every second">
								<Button onClick={(e) => {
									setPaddleReduce((shrink) => Number(!shrink))
								}} size='large' sx={{ fontWeight: 900, color: !!paddleReduce ? undefined : 'grey' }}>Shrink paddle</Button>
							</Tooltip>
						</Stack>
						<div>BallSpeed
							<Slider
								aria-label="Ball Speed"
								defaultValue={1.3}
								valueLabelDisplay="on"
								step={0.1}
								min={0.1}
								max={2}
								marks={[
									{ value: 0.1, label: "slow" },
									{ value: 1.3, label: "normal" },
									{ value: 2, label: "fast" }
								]}
								onChange={(_, val) => setballSpeed(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>ShootSpeed
							<Slider
								aria-label="Shoots Speed"
								defaultValue={1.5}
								valueLabelDisplay="on"
								step={0.1}
								min={0.1}
								max={2}
								marks={[
									{ value: 0.1, label: "slow" },
									{ value: 1.5, label: "normal" },
									{ value: 2, label: "fast" }
								]}
								onChange={(_, val) => setShootSpeed(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Victory
							<Slider
								aria-label="Victory Rounds"
								defaultValue={5}
								valueLabelDisplay="on"
								step={1}
								min={1}
								max={10}
								marks={[
									{ value: 1, label: "1" },
									{ value: 5, label: "5" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setVictoryRounds(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Paddle Reduce Speed
							<Slider
								aria-label="Paddle Reduce"
								defaultValue={1}
								valueLabelDisplay="auto"
								step={1}
								min={0}
								max={10}
								value={paddleReduce}
								marks={[
									{ value: 0, label: "off" },
									{ value: 1, label: "normal" },
									{ value: 10, label: "expert" }
								]}
								onChange={(_, val) => setPaddleReduce(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Paddle Length
							<Slider
								//aria-label="Paddle Length"
								value={paddleReduce ? paddleLen : paddleLen[1]}
								valueLabelDisplay="on"
								step={10}
								min={10}
								max={480}
								marks={[
									{ value: 10, label: "10" },
									{ value: 80, label: "default min" },
									{ value: 160, label: "default len" },
									{ value: 480, label: "480" }
								]}
								disableSwap
								onChange={(e, val, thumb) => handlePaddleLenChange(e, val, thumb)}
							/>
						</div>
						<div style={{ display: shoot ? 'block' : 'none' }}>Max Bouncing of shoots
							<Slider
								aria-label="MaxBounce Rounds"
								defaultValue={5}
								valueLabelDisplay="on"
								step={1}
								min={0}
								max={10}
								marks={[
									{ value: 0, label: "off" },
									{ value: 5, label: "5" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setMaxBounce(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div style={{ display: shoot ? 'block' : 'none' }}>Starting Ammo per player
							<Slider
								aria-label="Start Amo"
								defaultValue={3}
								valueLabelDisplay="on"
								step={1}
								min={1}
								max={10}
								marks={[
									{ value: 1, label: "1" },
									{ value: 3, label: "3" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setStartAmo(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div style={{ display: shoot ? 'block' : 'none' }}>Shoot size
							<Slider
								aria-label="shoot Size"
								defaultValue={3}
								valueLabelDisplay="on"
								step={1}
								min={1}
								max={10}
								marks={[
									{ value: 1, label: "1" },
									{ value: 3, label: "3" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setShootSize(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Ball size
							<Slider
								aria-label="ball Size"
								defaultValue={5}
								valueLabelDisplay="on"
								step={1}
								min={1}
								max={10}
								marks={[
									{ value: 1, label: "1" },
									{ value: 5, label: "5" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setBallSize(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Player Speed
							<Slider
								aria-label="Player speed"
								defaultValue={3}
								valueLabelDisplay="on"
								step={1}
								min={1}
								max={10}
								marks={[
									{ value: 1, label: "1" },
									{ value: 3, label: "3" },
									{ value: 10, label: "10" }
								]}
								onChange={(_, val) => setPlayerSpeed(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
						<div>Lift Effect
							<Slider
								aria-label="Lift effect"
								defaultValue={1}
								valueLabelDisplay="on"
								step={0.1}
								min={0}
								max={5}
								marks={[
									{ value: 0, label: "off" },
									{ value: 1, label: "default" },
									{ value: 5, label: "5" }
								]}
								onChange={(_, val) => setLiftEffect(Array.isArray(val) ? val[0] : val)}
							/>
						</div>
					</Box>
				</Box>

			}
			<ListCurrentGames joinGame={joinGame} />
		</Box>
	);
}
