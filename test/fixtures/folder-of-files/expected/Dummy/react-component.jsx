import React, { PropTypes } from 'react';

if (process.env.IS_BROWSER) {
	require('./scss/Dummy.scss');
}

const Dummy = () => (<div>Dummy</div>);

Dummy.propTypes = {
};

export default Dummy;
