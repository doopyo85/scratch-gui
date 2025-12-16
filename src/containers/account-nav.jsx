/*
NOTE: 코딩앤플레이 커스텀 버전
단순화된 AccountNav - 프로필+이름만 표시
*/

import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import AccountNavComponent from '../components/menu-bar/account-nav.jsx';

const AccountNav = function (props) {
    const {
        ...componentProps
    } = props;
    return (
        <AccountNavComponent
            {...componentProps}
        />
    );
};

AccountNav.propTypes = {
    thumbnailUrl: PropTypes.string,
    username: PropTypes.string
};

const mapStateToProps = state => {
    const session = state.scratchGui.session;
    const user = session && session.session && session.session.user;
    
    return {
        thumbnailUrl: user ? user.thumbnailUrl : null,
        username: user ? user.username : ''
    };
};

export default connect(
    mapStateToProps
)(AccountNav);
