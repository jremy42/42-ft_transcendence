import { PersonAdd } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, CircularProgress, CssBaseline, IconButton, Link, Menu, MenuItem, Typography } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useAuthService } from '../../auth/AuthService';
import apiClient from '../../auth/interceptor.axios';
import { SocketContext } from '../../socket/SocketProvider';
import { Channel, GameStatus, IgameInfo, Member, projectile } from "../../types";
import { InvitedFriends } from '../InvitedFriends';

interface Iprops {
	gameInfo: IgameInfo,
	gameId: string,
	bottomRef: React.RefObject<HTMLInputElement>;
	width: number;
	ballTrailPositions: projectile[];
	countdown: number
}

const canvasHeight = 480
const canvasWidth = 848

enum LoadingStatus {
	Loading,
	Loaded,
	Failed
}

interface IgameModuleProps {
	setActiveStep: (step: number) => void;
	width: number;
	setResult: (gameInfo: IgameInfo | null) => void;
	bottomRef: React.RefObject<HTMLInputElement>;
}



export function GameModule({ setActiveStep, width, setResult, bottomRef }: IgameModuleProps) {
	const [loading, setLoading] = useState<LoadingStatus>(LoadingStatus.Loading);
	const [joined, setJoined] = useState<boolean>(false);
	const { socket, customEmit } = useContext(SocketContext);
	const [gameInfo, setGameInfo] = useState<IgameInfo | null>(null);
	const [countdown, setCountdown] = useState<number>(0);
	const auth = useAuthService();

	const { idGame } = useParams<{ idGame: string }>();
	const [ballTrailPositions, setBallTrailPositions] = useState<projectile[]>([]);

	useEffect(() => {
		if (!joined) {
			setJoined(true)
			return
		}
		customEmit('game.join', { gameId: idGame }, (stringResponse: string) => {
			const response = JSON.parse(stringResponse)

			if (response.error) {
				setLoading(LoadingStatus.Failed);
			}
			else {
				setGameInfo(response.gameInfo as IgameInfo);
				setLoading(LoadingStatus.Loaded);
			}
		});
	}, [joined]);

	useEffect(() => {
		if (!gameInfo)
			return
		if (gameInfo.status === GameStatus.playing || gameInfo.status === GameStatus.start) {
			setActiveStep(2);
		}
		if (gameInfo.status === GameStatus.end) {
			setActiveStep(3);
			setResult(gameInfo)
		}
	}, [gameInfo?.status])


	useEffect(() => {
		if (!idGame || !socket) {
			return;
		}
		function onGameUpdate(data: IgameInfo) {
			setGameInfo(data);
			setBallTrailPositions((ballTrailPositions) => {
				const newBallTrailPositions = [...ballTrailPositions];
				//inverse de push ?

				newBallTrailPositions.push(data.ball);
				if (newBallTrailPositions.length > 20) {
					newBallTrailPositions.shift();
				}
				return newBallTrailPositions;
			});
		}

		function onCountdown(data: number) {
			setCountdown(data);
		}
		socket.on('game.update', onGameUpdate)
		socket.on('game.countdown', onCountdown)
		return () => {
			if (!socket) return;
			socket.off('game.update', onGameUpdate)
			socket.off('game.countdown', onCountdown)
		}
	}, [window.location.pathname])

	type ShortDMChannel = { id: number, friend: Member }
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const [dmChannelsList, setDMChannelsList] = useState<null | ShortDMChannel[]>(null);
	const [invitedFriends, setInvitedFriends] = useState<{ [id: number]: boolean }>({});

	function inviteFriendToGame(dmChannel: ShortDMChannel) {
		if (!idGame || !dmChannel) return;
		apiClient.post(`/api/chat/channels/${dmChannel.id}/messages`, { content: `Join my private game.`, gameId: idGame }).catch(() => {})

		setInvitedFriends({ ...invitedFriends, [dmChannel.friend.user.id]: true })
		closeFriendsList();
	}
	function fetchFriendsList() {
		apiClient.get<Channel[]>('/api/chat/channels/dm').then(({ data }) => {
			const channelsList: ShortDMChannel[] = data.map((channel) => ({
				id: channel.id,
				friend: channel.members.find((member) => member.user.id !== auth.user?.id),
			})).filter(channel => channel.friend) as ShortDMChannel[]
			setDMChannelsList(channelsList
				.filter(channel => channel.friend.isConnected)
			);
		}).catch(() => {})
	}

	function handleFriendsList(event: React.MouseEvent<HTMLButtonElement>) {
		fetchFriendsList();
		setAnchorEl(event.currentTarget);
	}

	function closeFriendsList() {
		setAnchorEl(null);
	}

	if (loading === LoadingStatus.Loading) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', paddingTop: '2rem', paddingBottom: '2rem', justifyContent: 'flex-start' }}>

				<Box sx={{ display: 'flex' }}>
					<CircularProgress />
				</Box>
			</div>
		);
	}

	if (loading === LoadingStatus.Loaded && idGame) {
		if (gameInfo?.status === GameStatus.waiting || gameInfo?.status === GameStatus.playing || gameInfo?.status === GameStatus.start) {
			return (
				<>
					{
						gameInfo.status === GameStatus.waiting &&
						<div style={{ display: 'flex', alignItems: 'center', paddingTop: '2rem', paddingBottom: '2rem', justifyContent: 'flex-start' }}>

							<Box sx={{ display: 'flex' }}>
								<CircularProgress />
							</Box>
							<Typography sx={{ pl: 2 }}>Waiting for players</Typography>
							{
								gameInfo.private && <InvitedFriends type='game' isConnected/>
							}


						</div>
					}
					<GameScreen gameInfo={gameInfo} gameId={idGame} bottomRef={bottomRef} width={width} ballTrailPositions={ballTrailPositions} countdown={countdown} />
				</>
			)
		}
	}

	return (
		<Box>
			<Typography
				variant='h5'
				sx={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}
			>Failed to load game (game not found)</Typography>
			<Link
				component={RouterLink}
				to='/'
				sx={{ textAlign: 'center', paddingBottom: '2rem', width: '100%', display: 'block' }}
			>Go back to home</Link>
		</Box>
	);
};



export function GameScreen({ gameInfo, gameId, bottomRef, width, ballTrailPositions, countdown }: Iprops): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<CanvasRenderingContext2D | null>(null);
	const { customEmit } = useContext(SocketContext);
	const [keyDown, setKeyDown] = useState({ up: false, down: false, shoot: false });
	const [canvasRatio, setCanvasRatio] = useState<number>(0.8 * Math.min(width / canvasWidth, window.innerHeight / canvasHeight))
	const [displayInfo, setDisplayInfo] = useState<boolean>(false);

	const handleClick = () => {
		setDisplayInfo(!displayInfo)
	}

	useEffect(() => {
		setCanvasRatio(0.8 * Math.min(width / canvasWidth, window.innerHeight / canvasHeight))
		if (bottomRef.current)
			bottomRef.current.scrollIntoView({ behavior: "smooth" })
	}, [width])


	useEffect(() => {
		const interval = setInterval(() => {
			if (keyDown.up) {
				customEmit('game.play.move', { gameId: gameId, move: 'Up' })
			}
			if (keyDown.down) {
				customEmit('game.play.move', { gameId: gameId, move: 'Down' })
			}
			if (keyDown.shoot) {
				customEmit('game.play.move', { gameId: gameId, move: 'Shoot' })
			}
		}, 8);
		return () => clearInterval(interval);
	}, [keyDown])

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			e.preventDefault();
			if (e.key === 'ArrowUp' && keyDown.up === false) {
				setKeyDown({ up: true, down: false, shoot: false })
			}
			if (e.key === 'ArrowDown' && keyDown.down === false) {
				setKeyDown({ up: false, down: true, shoot: false })
			}
			if (e.key === 'ArrowRight' && keyDown.shoot === false) {
				setKeyDown({ up: false, down: false, shoot: true })
			}
		}
		function handleKeyUp(e: KeyboardEvent) {
			if (e.key === 'ArrowUp') {
				setKeyDown({ up: false, down: false, shoot: false })
			}
			if (e.key === 'ArrowDown') {
				setKeyDown({ up: false, down: false, shoot: false })
			}
			if (e.key === 'ArrowRight') {
				setKeyDown({ up: false, down: false, shoot: false })
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [keyDown])

	useEffect(() => {
		const context2d = canvasRef.current?.getContext('2d');
		if (!context2d) return;
		context.current = context2d;

	}, []); // 1 seul call quand le return est fait

	const drawBallTrail = () => {
		const reverseBallTrailPositions = [...ballTrailPositions].reverse();
		if (!context.current || !ballTrailPositions) return;
		let trailOpacity = 0.5;
		for (let i = 0; i < reverseBallTrailPositions.length; i++) {
			const ballTrailPosition = reverseBallTrailPositions[i];
			trailOpacity = (1 - (i + 1) * 0.1) * trailOpacity;
			context.current.fillStyle = `rgba(64, 80, 181, ${trailOpacity})`;
			context.current.beginPath();
			context.current.arc(ballTrailPosition.pos.x * canvasRatio, ballTrailPosition.pos.y * canvasRatio, ballTrailPosition.size * canvasRatio, 0, 2 * Math.PI)
			context.current.fill();
		}
	}
	useEffect(() => {
		if (!context.current) return;

		const player1color = "#4050B5"
		const player2color = "rgba(180, 180, 255, 1.0)"
		const tranparentBlankColor = "rgba(255, 255, 255, 0.5)"
		const assetcolor = "#4050B5"
		const ballcolor = "#4050B5"
		const backgroundColor = "#ffffff"
		const strokeColor = "#4050B5"

		// Clear canvas
		context.current.clearRect(0, 0, canvasWidth * canvasRatio, canvasHeight * canvasRatio);
		context.current.fillStyle = backgroundColor;
		context.current.strokeStyle = strokeColor; // Bleu
		context.current.lineWidth = 2;
		context.current.strokeRect(0, 0, canvasWidth * canvasRatio, canvasHeight * canvasRatio);
		context.current.fillRect(0, 0, canvasWidth * canvasRatio, canvasHeight * canvasRatio);

		// Player One
		context.current.fillStyle = player1color;
		if (gameInfo.players[0]) {
			const rectX = 0;
			const rectY = gameInfo.players[0].pos * canvasRatio;
			const rectWidth = gameInfo.players[0].paddleWidth * canvasRatio;
			const rectHeight = gameInfo.players[0].paddleLength * canvasRatio;

			const cornerRadius = 5; // Valeur du rayon de coin arrondi

			context.current.beginPath();
			context.current.moveTo(rectX + cornerRadius, rectY);
			context.current.lineTo(rectX + rectWidth - cornerRadius, rectY);
			context.current.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
			context.current.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
			context.current.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
			context.current.lineTo(rectX + cornerRadius, rectY + rectHeight);
			context.current.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
			context.current.lineTo(rectX, rectY + cornerRadius);
			context.current.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
			context.current.closePath();
			context.current.fill();

			if (gameInfo.players[0].shoot.active) {
				context.current.beginPath();
				context.current.arc(gameInfo.players[0].shoot.pos.x * canvasRatio, gameInfo.players[0].shoot.pos.y * canvasRatio, gameInfo.players[0].shoot.size * canvasRatio, 0, 2 * Math.PI);
				context.current.fill();
			}
		}
		// Player Two
		context.current.fillStyle = player2color;
		if (gameInfo.players[1]) {
			const rectX = (canvasWidth - gameInfo.players[1].paddleWidth) * canvasRatio;
			const rectY = gameInfo.players[1].pos * canvasRatio;
			const rectWidth = gameInfo.players[1].paddleWidth * canvasRatio;
			const rectHeight = gameInfo.players[1].paddleLength * canvasRatio;

			const cornerRadius = 5; // Valeur du rayon de coin arrondi

			context.current.beginPath();
			context.current.moveTo(rectX + cornerRadius, rectY);
			context.current.lineTo(rectX + rectWidth - cornerRadius, rectY);
			context.current.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
			context.current.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
			context.current.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
			context.current.lineTo(rectX + cornerRadius, rectY + rectHeight);
			context.current.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
			context.current.lineTo(rectX, rectY + cornerRadius);
			context.current.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
			context.current.closePath();
			context.current.fill();

			if (gameInfo.players[1].shoot.active) {
				context.current.beginPath();
				context.current.arc(gameInfo.players[1].shoot.pos.x * canvasRatio, gameInfo.players[1].shoot.pos.y * canvasRatio, gameInfo.players[0].shoot.size * canvasRatio, 0, 2 * Math.PI);
				context.current.fill();
			}
		}

		// Assets
		context.current.fillStyle = assetcolor;
		if (gameInfo.assets.length > 0) {
			gameInfo.assets.forEach((asset) => {
				const rectX = asset.x * canvasRatio;
				const rectY = asset.y * canvasRatio;
				const rectWidth = asset.width * canvasRatio;
				const rectHeight = asset.height * canvasRatio;

				const cornerRadius = 5; // Valeur du rayon de coin arrondi
				if (context.current) {

					context.current.beginPath();
					context.current.moveTo(rectX + cornerRadius, rectY);
					context.current.lineTo(rectX + rectWidth - cornerRadius, rectY);
					context.current.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
					context.current.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
					context.current.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
					context.current.lineTo(rectX + cornerRadius, rectY + rectHeight);
					context.current.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
					context.current.lineTo(rectX, rectY + cornerRadius);
					context.current.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
					context.current.closePath();
					context.current.fill();
				}
			});
		}

		// center line
		context.current.beginPath();
		context.current.strokeStyle = "#4050B5";
		context.current.moveTo(canvasWidth * canvasRatio / 2, 0);
		context.current.lineTo(canvasWidth * canvasRatio / 2, canvasHeight * canvasRatio);
		context.current.stroke();

		// Ball
		drawBallTrail();
		context.current.fillStyle = ballcolor
		context.current.beginPath();
		context.current.arc(gameInfo.ball.pos.x * canvasRatio, gameInfo.ball.pos.y * canvasRatio, gameInfo.ball.size * canvasRatio, 0, 2 * Math.PI)
		context.current.fill();

		// Scores
		context.current.font = `${48 * canvasRatio}px Roboto`
		context.current.fillText(`${gameInfo.players[0].score}`, (canvasWidth / 2 - 80) * canvasRatio, 80 * canvasRatio)
		if (gameInfo.players[1])
			context.current.fillText(`${gameInfo.players[1].score}`, (canvasWidth / 2 + 60) * canvasRatio, 80 * canvasRatio)

		// Player Info
		const p1AmmoInfo : string = Array.from(Array(gameInfo.players[0].ammo)).map(()=> "o").join(' ')
		context.current.font = `${20 * canvasRatio}px  Roboto`
		context.current.fillStyle = player1color
		context.current.fillText(`${gameInfo.players[0].user.username}`, 12 * canvasRatio, 20 * canvasRatio)
		context.current.fillText(`${(p1AmmoInfo.length) ? p1AmmoInfo : ""}`, 12 * canvasRatio, 40 * canvasRatio)
		context.current.fillStyle = player2color
		if (gameInfo.players[1]) {
			const p2AmmoInfo : string = Array.from(Array(gameInfo.players[1].ammo)).map(()=> "o").join(' ')
			const player2info = `${gameInfo.players[1].user.username}`
			const player2infoAmmo = `${(p2AmmoInfo.length) ? p2AmmoInfo : ""}`
			context.current.fillText(player2info, canvasWidth * canvasRatio - (12 * canvasRatio + context.current.measureText(player2info).width), 20 * canvasRatio)
			context.current.fillText(player2infoAmmo, canvasWidth * canvasRatio - (12 * canvasRatio + context.current.measureText(player2infoAmmo).width), 40 * canvasRatio)
		}

		//CountDown
		if (countdown !== 0) {
			context.current.fillStyle = tranparentBlankColor;
			context.current.fillRect(0, 0, canvasWidth * canvasRatio, canvasHeight * canvasRatio);
			context.current.fillStyle = strokeColor;
			context.current.font = `${72 * canvasRatio}px Roboto`
			const countDownText = countdown.toString()
			context.current.fillText(countDownText, (canvasWidth * canvasRatio - context.current.measureText(countDownText).width) * 0.5, canvasHeight * canvasRatio * 0.5)
			return
		}


	}, [gameInfo.players, gameInfo.ball.pos, countdown]);

	return (
		<div>
			{
				false && <>
					<button onClick={handleClick}>{(displayInfo) ? "Hide" : "Show" + " Info"}</button>
					<div> {displayInfo ?
						<>
							<div> <h1>Game Info :</h1></div>
							<div> Velocity x :{(gameInfo?.ball.velocity.x)} </div>
							<div> Velocity y :{(gameInfo?.ball.velocity.y)} </div>
							<div> posBall x :{gameInfo?.ball.pos.x} </div>
							<div> posBall y: {gameInfo?.ball.pos.y} </div>
							<div> posP1: {gameInfo?.players[0].pos} </div>
							<div> momentumP1: {gameInfo?.players[0].momentum} </div>
							<div> paddleLengthP1: {gameInfo?.players[0].paddleLength} </div>
							<div> posP2: {gameInfo?.players[1]?.pos} </div>
							<div> momentumP2: {gameInfo?.players[1]?.momentum} </div>
							<div> paddleLengthP2: {gameInfo?.players[1]?.paddleLength} </div>
							<div> score: {`${gameInfo?.players[0].score}:${gameInfo?.players[1]?.score}`} </div>
							<div> status: {gameInfo?.status} </div>
							<div> date: {gameInfo?.date.toString()} </div>
						</> : <></>}
					</div>
				</>
			}
			<Box display="flex" justifyContent="flex-end" alignItems="center">
				<Typography>
					{gameInfo?.viewers || 0}
				</Typography>
				<VisibilityIcon />
			</Box>
			<div>
				<CssBaseline />
				<canvas width={canvasWidth * canvasRatio} height={canvasHeight * canvasRatio} style={{
					border: "2px solid #4050B5", borderRadius: "16px", paddingLeft: "20px", paddingRight: "20px", paddingTop: "5px", paddingBottom: "5px", display: "block", marginLeft: "auto", marginRight: "auto"
				}} ref={canvasRef} />
			</div>
			<div ref={bottomRef} style={{ height: "10px" }}>
			</div>
		</div>
	)
}

