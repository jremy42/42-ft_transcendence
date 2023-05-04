import React, { FC } from 'react';
import PropTypes from 'prop-types';
import cx from 'clsx';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

interface ChatMsgProps {
	messages: string[];
	side: 'left' | 'right';
	avatar: string;
	username: string;
}

export const ChatMsg: FC<ChatMsgProps> = ({ side, avatar, messages, username }) => {
	console.log(side)
	return (
		<Grid
			container
			spacing={2}
			justifyContent={side === 'right' ? 'flex-end' : 'flex-start'}
		>
			{side === 'left' && (
				<Grid item>
					<Avatar
						src={avatar}
					/>
				</Grid>
			)}
			<Grid item xs={8}>
				{/* text containing username in grey color and little size */}

				{side === 'left' && (
					<Typography
						align={'left'}
						variant={'caption'}
						color={'textSecondary'}
					>
						{username}
					</Typography>
				)}
				{messages.map((msg: string, index: number) => {
					const borderStyle = side === 'left' ? {
						borderTopLeftRadius: index === 0 ? 10 : 5,
						borderBottomLeftRadius: index === messages.length - 1 ? 10 : 5,
					} : {
						borderTopRightRadius: index === 0 ? 10 : 5,
						borderBottomRightRadius: index === messages.length - 1 ? 10 : 5,
					};
					return (
						<div key={index}
							style={{
								backgroundColor: side === 'left' ? '#e0e0e0' : 'rgb(62, 74, 142)',
								color: side === 'left' ? '#000' : '#fff',
								borderRadius: 10,
								padding: 10,
								marginBottom: 5,
								marginTop: 5,
								maxWidth: '80%',
								wordWrap: 'break-word',
								textAlign: side === 'left' ? 'left' : 'right',
								marginLeft: side === 'left' ? 0 : 'auto',
								marginRight: side === 'left' ? 'auto' : 0,
								...borderStyle

							}}
						>
							<Typography
								align={'left'}
							>
								{msg}
							</Typography>
						</div>
					)
				})}
			</Grid>
		</Grid>
	);
};