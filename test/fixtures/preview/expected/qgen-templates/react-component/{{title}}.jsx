import React, { PropTypes } from 'react';

if (process.env.IS_BROWSER) {
	require('./scss/{{title}}.scss');
}

const {{title}} = () => (<div>{{title}}</div>);

{{title}}.propTypes = {
};

export default {{title}};
