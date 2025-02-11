import './styles.module.scss';
import Link from 'components/Link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIsomorphicLayoutEffect } from 'react-use';

const flashyTitleColors = [
	'#de3535',
	'#dd8137',
	'#f3ff5b',
	'#63d606',
	'#4193c4',
	'#953ddb'
];

const getFlashyTitleColor = () => flashyTitleColors[Math.floor(Math.random() * flashyTitleColors.length)];

const FlashyTitle = () => {
	const [color, setColor] = useState(getFlashyTitleColor);

	const router = useRouter();
	const asPathQueryIndex = router.asPath.indexOf('?');
	const asPathname = (
		asPathQueryIndex === -1
			? router.asPath
			// Slice off the query so the effect hook isn't cycled when the query changes.
			: router.asPath.slice(0, asPathQueryIndex)
	);

	useIsomorphicLayoutEffect(() => () => {
		setColor(getFlashyTitleColor());
	}, [asPathname]);

	return (
		<div id="flashy-title-container">
			<style jsx global>
				{`
					#flashy-title {
						background-color: ${color};
					}
				`}
			</style>
			<Link
				id="flashy-title"
				href="/"
				title="MSPFA Home"
				tabIndex={-1}
				draggable={false}
			/>
		</div>
	);
};

export default FlashyTitle;