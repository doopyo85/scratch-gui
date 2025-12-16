/*
NOTE: this file only temporarily resides in scratch-gui.
Nearly identical code appears in scratch-www, and the two should
eventually be consolidated.
*/

import {injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import AccountNavComponent from '../components/menu-bar/account-nav.jsx';
import {clearSession} from '../reducers/session';

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
    classroomId: PropTypes.string,
    isEducator: PropTypes.bool,
    isRtl: PropTypes.bool,
    isStudent: PropTypes.bool,
    onLogOut: PropTypes.func,
    profileUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    username: PropTypes.string
};

const mapStateToProps = state => ({
    classroomId: state.scratchGui.session && state.scratchGui.session.session && state.scratchGui.session.session.user ?
        state.scratchGui.session.session.user.classroomId : '',
    isEducator: state.scratchGui.session && state.scratchGui.session.permissions && state.scratchGui.session.permissions.educator,
    isStudent: state.scratchGui.session && state.scratchGui.session.permissions && state.scratchGui.session.permissions.student,
    profileUrl: state.scratchGui.session && state.scratchGui.session.session && state.scratchGui.session.session.user ?
        `/users/${state.scratchGui.session.session.user.username}` : '',
    thumbnailUrl: state.scratchGui.session && state.scratchGui.session.session && state.scratchGui.session.session.user ?
        state.scratchGui.session.session.user.thumbnailUrl : null,
    username: state.scratchGui.session && state.scratchGui.session.session && state.scratchGui.session.session.user ?
        state.scratchGui.session.session.user.username : ''
});

const mapDispatchToProps = dispatch => ({
    onLogOut: () => {
        // 3000번 서버 로그아웃 호출
        fetch('/logout', {
            method: 'GET',
            credentials: 'include'
        })
        .then(() => {
            dispatch(clearSession());
            // 로그인 페이지로 리다이렉트
            window.location.href = '/auth/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
            // 에러가 나도 세션은 클리어하고 리다이렉트
            dispatch(clearSession());
            window.location.href = '/auth/login';
        });
    }
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(AccountNav));
