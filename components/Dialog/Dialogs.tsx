import { useDialogs } from 'modules/client/dialogs';
import Dialog from 'components/Dialog';

/**
 * The component which renders the dialog stack.
 * 
 * ⚠️ This should only be rendered from inside the `Page` component.
 */
const Dialogs = () => {
	const dialogs = useDialogs();
	
	return (
		<div id="dialogs">
			{dialogs.map(dialog => <Dialog key={dialog.id} dialog={dialog} />)}
		</div>
	);
};

export default Dialogs;