/*
NOTE: 코딩앤플레이 커스텀 버전
드롭다운 메뉴 제거, 프로필+이름만 표시
*/

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import UserAvatar from './user-avatar.jsx';

import styles from './account-nav.css';

const AccountNavComponent = ({
    className,
    thumbnailUrl,
    username
}) => (
    <div
        className={classNames(
            styles.userInfo,
            className
        )}
        style={{cursor: 'default'}}
    >
        {thumbnailUrl ? (
            <UserAvatar
                className={styles.avatar}
                imageUrl={thumbnailUrl}
            />
        ) : null}
        <span className={styles.profileName}>
            {username}
        </span>
    </div>
);

AccountNavComponent.propTypes = {
    className: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    username: PropTypes.string
};

export default AccountNavComponent;
