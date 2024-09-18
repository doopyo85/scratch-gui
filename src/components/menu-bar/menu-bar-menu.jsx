import PropTypes from 'prop-types';
import React from 'react';
import Menu from '../../containers/menu.jsx';

const MenuBarMenu = ({
    children,
    className,
    onRequestClose = () => {},  // 기본 닫기 함수 설정
    open = false,  // 기본적으로 메뉴는 닫힌 상태로 설정
    place = 'right'
}) => (
    <div className={className}>
        <Menu
            open={open}
            place={place}
            onRequestClose={onRequestClose}  // 항상 onRequestClose가 전달되도록 기본값 추가
        >
            {children}
        </Menu>
    </div>
);

MenuBarMenu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    onRequestClose: PropTypes.func,
    open: PropTypes.bool,
    place: PropTypes.oneOf(['left', 'right'])
};

export default MenuBarMenu;
