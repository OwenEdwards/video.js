/**
 * @file volume-menu-button.js
 */
import Button from '../button.js';
import Component from '../component.js';
import * as Fn from '../utils/fn.js';
import Menu from '../menu/menu.js';
import MenuButton from '../menu/menu-button.js';
import MuteToggle from './mute-toggle.js';
import VolumeBar from './volume-control/volume-bar.js';

/**
 * Button for volume menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class VolumeMenuButton
 */
class VolumeMenuButton extends MenuButton {

  constructor(player, options={}){
    // Default to inline
    if (options.inline === undefined) {
      options.inline = true;
    }

    // If the vertical option isn't passed at all, default to true.
    if (options.vertical === undefined) {
      // If an inline volumeMenuButton is used, we should default to using
      // a horizontal slider for obvious reasons.
      if (options.inline) {
        options.vertical = false;
      } else {
        options.vertical = true;
      }
    }

    // The vertical option needs to be set on the volumeBar as well,
    // since that will need to be passed along to the VolumeBar constructor
    options.volumeBar = options.volumeBar || {};
    options.volumeBar.vertical = !!options.vertical;

    super(player, options);

    // Same listeners as MuteToggle
    this.on(player, 'volumechange', this.volumeUpdate);
    this.on(player, 'loadstart', this.volumeUpdate);

    // hide mute toggle if the current tech doesn't support volume control
    function updateVisibility() {
      if (player.tech_ && player.tech_['featuresVolumeControl'] === false) {
        this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }

    updateVisibility.call(this);
    this.on(player, 'loadstart', updateVisibility);

    this.toggleMutedLabel();

    this.on('focus', function() {
      this.el_.setAttribute('aria-expanded', 'true');
    });

    let playerEl = player.el();
    let handleMouseOver = (event) => {
      if (event.target !== this.el_ && event.target !== this.volumeBar.el_) {
        this.el_.setAttribute('aria-expanded', 'false');
      }
    };
    playerEl.onfocusin = handleMouseOver;
    playerEl.addEventListener('focus',handleMouseOver,true);

    player.on('dispose', function() {
      playerEl.onfocusin = null;
      playerEl.removeEventListener('focus',handleMouseOver, true);
    });

    this.on(this.volumeBar, ['slideractive', 'focus'], Fn.bind(this, function(){
      this.el_.setAttribute('aria-expanded', 'true');
      this.volumeBar.addClass('vjs-slider-active');
    }));

    this.on(this.volumeBar, ['sliderinactive', 'blur'], Fn.bind(this, function(){
      this.el_.setAttribute('aria-expanded', 'false');
      this.volumeBar.removeClass('vjs-slider-active');
    }));

    this.on(this.volumeBar, 'keydown', Fn.bind(this, function(event) {
      if (event.which === 27) {
        this.el_.focus();
      }
    }));
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    let orientationClass = '';
    if (!!this.options_.vertical) {
      orientationClass = 'vjs-volume-menu-button-vertical';
    } else {
      orientationClass = 'vjs-volume-menu-button-horizontal';
    }

    return `vjs-volume-menu-button ${super.buildCSSClass()} ${orientationClass}`;
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {Menu} The volume menu button
   * @method createMenu
   */
  createMenu() {
    let menu = new Menu(this.player_, {
      contentElType: 'div'
    });

    let vb = new VolumeBar(this.player_, this.options_.volumeBar);

    menu.addChild(vb);

    this.volumeBar = vb;
    return menu;
  }

  /**
   * Handle click on volume menu and calls super
   *
   * @method handleClick
   */
  handleClick(event) {
    MuteToggle.prototype.handleClick.call(this);
    this.toggleMutedLabel();
    super.handleClick();
  }

  toggleMutedLabel() {
    if (this.player_.muted()) {
      this.el_.setAttribute('aria-label', 'Mute Toggle, Muted');
    } else {
      this.el_.setAttribute('aria-label', 'Mute Toggle, Not Muted');
    }
  }

  handleKeyPress(event) {
    if ((event.which === 32 || event.which === 13) &&
        (event.target !== this.volumeBar.el())) {
      this.handleClick(event);
    }
  }

  attachVolumeBarEvents() {
    this.on(['mousedown', 'touchdown'], this.handleMouseDown);
  }

  handleMouseDown(event) {
    this.on(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
    this.on(document, ['mouseup', 'touchend'], this.handleMouseUp);
  }

  handleMouseUp(event) {
    this.off(['mousemove', 'touchmove'], Fn.bind(this.volumeBar, this.volumeBar.handleMouseMove));
  }
}

VolumeMenuButton.prototype.volumeUpdate = MuteToggle.prototype.update;
VolumeMenuButton.prototype.controlText_ = 'Mute';

Component.registerComponent('VolumeMenuButton', VolumeMenuButton);
export default VolumeMenuButton;
