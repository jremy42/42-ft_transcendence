import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'clsx';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { Message } from '../../types';
import { Button, styled } from '@mui/material';
import { Link as LinkRouter } from "react-router-dom";

interface ChatMsgProps {
	messages: Message[];
	side: 'left' | 'right';
	avatar: string;
	username: string;
	blocked?: boolean;
}

export const ChatMsg: FC<ChatMsgProps> = ({ side, avatar, messages, username, blocked = false }) => {
	const [showBlocked, setShowBlocked] = useState<boolean>(!blocked);

	useEffect(() => {
		setShowBlocked(!blocked);
	}, [blocked]);

	return (
		<Grid
			container
			spacing={2}
			justifyContent={side === 'right' ? 'flex-end' : 'flex-start'}
		>
			{side === 'left' && showBlocked && (
				<Grid item>
					<Avatar
						src={avatar}
					/>
				</Grid>
			)}
			<Grid item xs={8}>
				{/* text containing username in grey color and little size */}

				{side === 'left' && showBlocked && (
					<Typography
						align={'left'}
						variant={'caption'}
						color={'textSecondary'}
					>
						{username}
					</Typography>
				)}
				{!showBlocked && (
					<Msg
						side={side}
						index={0}
						lastIndex={0}
					>
						<Typography
							align={'left'}
						>
							{`${messages.length} blocked message${messages.length > 1 ? 's' : ''}.`}
							{blocked && (
							<Button
								variant='text'
								color='secondary'
								onClick={() => setShowBlocked(true)}
							>Show message</Button>
						)}
						</Typography>

					</Msg>
				)}

				{showBlocked && messages.map((msg: Message, index: number) => {
					return (
						<Msg
							key={index}
							side={side}
							index={index}
							lastIndex={messages.length - 1}
						>
							<>
								<Typography
									align={'left'}
								>
									{msg.content}
								</Typography>
								{msg.gameId &&
									<Button
										variant='contained'
										color='success'
										component={LinkRouter} to={`/game/${msg.gameId}`}
									>Join Game</Button>
								}
							</>
						</Msg>
					)
				})}
			</Grid>
		</Grid>
	);
};

interface MessageProps {
	side: 'left' | 'right';
	index: number;
	lastIndex: number;
}

const Msg = styled('div')<MessageProps>(({ theme, side, index, lastIndex }) => {
	const borderStyle = side === 'left' ? {
		borderTopLeftRadius: index === 0 ? theme.shape.borderRadius : 5,
		borderBottomLeftRadius: index === lastIndex ? theme.shape.borderRadius : 5,
	} : {
		borderTopRightRadius: index === 0 ? theme.shape.borderRadius : 5,
		borderBottomRightRadius: index === lastIndex ? theme.shape.borderRadius : 5,
	};

	return {
		backgroundColor: side === 'left' ? '#e0e0e0' : 'rgb(62, 74, 142)',
		color: side === 'left' ? '#000' : '#fff',
		borderTopRightRadius: theme.shape.borderRadius,
		borderBottomRightRadius: theme.shape.borderRadius,
		borderTopLeftRadius: theme.shape.borderRadius,
		borderBottomLeftRadius: theme.shape.borderRadius,
		padding: 10,
		marginBottom: 5,
		marginTop: 5,
		maxWidth: '80%',
		wordWrap: 'break-word',
		marginLeft: side === 'left' ? 0 : 'auto',
		marginRight: side === 'left' ? 'auto' : 0,
		...borderStyle
	}
});
