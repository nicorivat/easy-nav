export enum KeyboardKeys {
  TAB_KEY = 'Tab',
  ARROW_KEY_RIGHT = 'ArrowRight',
  ARROW_KEY_LEFT = 'ArrowLeft',
  ENTER_KEY = 'Enter',
  SPACE_KEY = 'Space',
}

export enum ElementType {
  INPUT,
  BUTTON,
  LIST,
  MODAL,
  TABLIST,
  TAB,
  LABEL,
  LINK
}

export interface Attribute {
  name: string;
  value: string;
}

export interface OnClick {
  id: string;
  action: string;
}

export interface InteractableElement {
  id: string;
  elem: HTMLElement;
  type: ElementType;
  elemToStyle?: string;
  onClick?: OnClick[];
  x: number;
  y: number;
}

export interface RouteConfig {
  route: string;
  items: ElementList[];
}

export interface ElementList {
  id: string;
  type: ElementType;
  itemType?: ElementType;
  elemToStyle?: string;
  modalElements?: ElementList[];
  tabElements?: string[];
  onClick?: OnClick[];
  attributes?: Attribute[];
}

export interface Route {
  path: string;
  elements: ElementList[];
}

export interface Navigation {
  general: {
    header: ElementList[];
    footer: ElementList[];
  };
  routes: Route[];
}

// TODO work on Tablist element - refacto
export class KeyboardNavigation {
  private config: Navigation;
  private currentIndex = 0;
  private previousIndex = 0;
  private currentType: ElementType;
  private navInlist = false;
  private listItems: HTMLElement[] = [];
  private currentIndexList = -1;
  private givenId: ElementList[];
  private onFocusClass = 'onFocus';
  private simulateFocusClass = 'simulate-focus';
  private disabledClass = 'disabled-element';
  private keyBinded = false;
  private onNavigation = false;

  private foundElems: InteractableElement[] = [];

  private mutationObserver = new MutationObserver(mutations => {
    this.findElements();
    if (!this.onNavigation) this.removeElementsStyles();
  });

  public init(data: any, fClass?: string, sClass?: string, dClass?: string) {
    if (fClass) this.onFocusClass = fClass;
    if (sClass) this.simulateFocusClass = sClass;
    if (dClass) this.disabledClass = dClass;

    this.config = data;
    document.addEventListener('mousedown', this.resetNavigation.bind(this));
    document.addEventListener('keydown', this.listenKeyDown.bind(this));
    this.keyBinded = true;
    this.setStyle();
  }

  public onChangeRoute(routeName: string) {
    const route: Route = this.config.routes.find(r => r.path === routeName);
    if (!route) {
      if (this.config.general.header.length > 0) this.givenId = this.config.general.header;
      if (this.config.general.footer.length > 0) this.givenId = [...this.givenId, ...this.config.general.footer];
      if (this.givenId.length === 0) return this.reset();
    } else
      this.givenId = this.config.general.header
        .concat(route.elements)
        .concat(this.config.general.footer)
        .filter(e => !!e);
    if (!this.keyBinded) document.addEventListener('keydown', this.listenKeyDown.bind(this));
    this.setEvents();
  }

  private setEvents() {
    this.setStyle();
    this.mutationObserver.observe(document.body, {
      attributes: false,
      childList: true,
      characterData: false,
      subtree: true,
    });
    document.body.addEventListener(
      'focus',
      event => {
        if (this.navInlist) return this.updateNavInList(false);
        let index;
        if ((index = this.foundElems.findIndex(e => e.elem === event.target)) === -1) return;
        this.checkFocusStyle(this.currentIndex, 'remove');
        this.currentIndex = index;
        this.currentType = this.foundElems[index].type;
        this.checkFocusStyle(this.currentIndex, 'add');
      },
      true,
    );
  }

  private removeElementsStyles() {
    if (this.foundElems.length > 0)
      this.foundElems.map(elem => {
        if (
          document.body.contains(document.getElementById(elem.elemToStyle)) ||
          document.body.contains(document.getElementById(elem.id))
        ) {
          if (elem.elemToStyle)
            return document.getElementById(elem.elemToStyle).classList.remove(this.simulateFocusClass);
          return document.getElementById(elem.id).classList.remove(this.onFocusClass);
        }
      });
  }

  private reset() {
    this.currentIndex = 0;
    this.previousIndex = 0;
    this.currentType = null;
    this.navInlist = false;
    this.listItems = [];
    this.currentIndexList = -1;
    this.givenId = [];
    this.keyBinded = false;
    this.foundElems = [];
    document.removeEventListener('keydown', this.listenKeyDown.bind(this));
  }

  private resetNavigation() {
    this.onNavigation = false;
    this.removeElementsStyles();
  }

  private checkFocusStyle(id: number, call: string) {
    const entry = this.foundElems[id];
    if (!entry) return;
    const otherElements = this.foundElems.filter(f => f.elemToStyle && f.id !== entry.id);
    if (entry && entry.elemToStyle) document.getElementById(entry.elemToStyle).classList[call](this.simulateFocusClass);
    otherElements.map(e => document.getElementById(e.elemToStyle).classList.remove(this.simulateFocusClass));
  }

  // Remove focus style for non-interactive elements
  private setStyle() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '* { outline: none; }';
    document.body.appendChild(style);
  }

  private findElements() {
    let newArray = [];
    let modal = null;
    if (this.givenId.length === 0) this.reset();
    if (
      JSON.stringify(this.foundElems) === JSON.stringify(this.givenId) &&
      !this.givenId.find(e => e.type === ElementType.TABLIST || e.type === ElementType.LIST)
    ) {
      newArray = this.foundElems.filter(e => document.body.contains(e.elem));
      return this.updateFoundElems(newArray);
    }
    if (
      (modal = this.givenId.find(
        e => e.type === ElementType.MODAL && e.modalElements && document.body.contains(document.getElementById(e.id)),
      ))
    ) {
      newArray = this.searchForElements(modal.modalElements);
    } else {
      newArray = this.searchForElements(this.givenId);
    }

    this.updateFoundElems(newArray.filter(e => !!e && e.type !== ElementType.TABLIST && e.type !== ElementType.LIST));
  }

  searchForElements(array: ElementList[]): InteractableElement[] {
    const newArray: InteractableElement[] = [];
    array.map(element => {
      const elem = document.getElementById(element.id);
      if (document.body.contains(elem)) {
        if (element.attributes) element.attributes.map(e => elem.setAttribute(e.name, e.value));
        if (element.type === ElementType.LIST || element.type === ElementType.TABLIST) {
          let index = 0;
          let child: HTMLElement;
          let id = '';

          const isList = element.type === ElementType.LIST;
          const childType = isList ? element.itemType || ElementType.LABEL : ElementType.TAB;

          document.getElementById(element.id).setAttribute('role', isList ? 'list' : 'tablist');

          while (document.body.contains((child = document.getElementById((id = `${element.id}-${++index}`))))) {
            if (isList) {
              child.setAttribute('role', 'listitem');
            } else if (element.tabElements && element.tabElements.length > 0) {
              const tabElement = element.tabElements[index - 1];
              child.setAttribute('aria-controls', tabElement);
              const htmlElement = document.getElementById(tabElement);
              if (htmlElement) htmlElement.setAttribute('aria-labelledby', id);
              child.setAttribute('role', 'tab');
            }
            newArray.push(this.createInteractableObject({ ...element, id, type: childType }, child));
          }
          return;
        }
        newArray.push(this.createInteractableObject(element, elem));
      }
    });
    return newArray;
  }

  private createInteractableObject(element: ElementList, elem: HTMLElement) {
    const rect = elem.getBoundingClientRect();
    return {
      ...element,
      elem,
      x: rect.left,
      y: rect.top,
    } as InteractableElement;
  }

  private updateFoundElems(newArray: InteractableElement[]) {
    this.foundElems = newArray;
    this.initElems();
  }

  private updateNavInList(isNav: boolean) {
    this.navInlist = isNav;
    this.onChangeListNav(isNav);
  }

  private onChangeListNav(isNav: boolean) {
    if (!isNav) {
      if (this.foundElems.length === 0) return;
      const currentList = this.foundElems[this.currentIndex];
      if (!currentList) return (this.navInlist = false);
      if (currentList.elemToStyle)
        document.getElementById(currentList.elemToStyle).classList.add(this.simulateFocusClass);
      else {
        currentList.elem.classList.add(this.onFocusClass);
        currentList.elem.focus();
      }
      this.listItems[this.currentIndexList].classList.remove(this.simulateFocusClass);
      this.currentIndexList = -1;
      return (this.listItems = []);
    }
    if (this.listItems.length === 0) {
      let i = 0;
      let elem: HTMLElement;
      let givenElem: InteractableElement;
      while (
        document.body.contains(
          (elem = document.getElementById(`${(givenElem = this.foundElems[this.currentIndex]).id}-${i++}`)),
        )
      ) {
        elem.setAttribute('aria-activedescendant', this.foundElems[this.currentIndex].id);
        elem.setAttribute('role', 'listitem');
        this.listItems.push(elem);
      }
      const currentList = this.foundElems[this.currentIndex];
      if (currentList.elemToStyle)
        document.getElementById(currentList.elemToStyle).classList.remove(this.simulateFocusClass);
      else currentList.elem.classList.remove(this.onFocusClass);
    }
  }

  private initElems() {
    const allElem = document.getElementsByTagName('*');
    let number = 1;

    for (let i = 0; i < allElem.length; i++) allElem[i].setAttribute('tabindex', '-1');

    this.foundElems.map(e => {
      if (e.type !== ElementType.INPUT) if (!e.elemToStyle) e.elem.classList.add(this.onFocusClass);
      e.elem.setAttribute('tabindex', number.toString());
      this.addBasicAttributes(e);
      ++number;
    });
  }

  private addBasicAttributes(elem: InteractableElement) {
    const htmlElement = document.getElementById(elem.id);
    switch (elem.type) {
      case ElementType.INPUT:
        htmlElement.setAttribute('role', 'text');
        break;
      case ElementType.BUTTON:
        htmlElement.setAttribute('role', 'button');
        break;
      case ElementType.MODAL:
        htmlElement.setAttribute('role', 'dialog');
        break;
      case ElementType.LIST:
        htmlElement.setAttribute('role', 'list');
        break;
      case ElementType.LINK:
        htmlElement.setAttribute('role', 'link');
        break;
      default:
        break;
    }
  }

  private listenKeyDown(event: any) {
    switch (event.key) {
      case KeyboardKeys.ENTER_KEY:
        // évite le double click sur les links
        event.preventDefaul();
        this.handleClick();
        break;
      case KeyboardKeys.SPACE_KEY:
        // évite le double click sur les boutons
        event.preventDefaul();
        this.handleClick();
        break;
      case KeyboardKeys.TAB_KEY:
        if (!this.onNavigation) {
          this.onNavigation = true;
          this.findElements();
        }
        this.previousIndex = this.currentIndex;
        // To be sure that this piece of code will be executed after the onFocus event
        setTimeout(() => {
          let elemToStyle;
          if (
            this.foundElems.length > 0 &&
            (this.currentIndex + 1 === this.foundElems.length || this.currentIndex - 1 === -1) &&
            this.currentIndex === this.previousIndex &&
            (elemToStyle = this.foundElems[this.currentIndex].elemToStyle)
          )
            this.checkFocusStyle(this.currentIndex, 'remove');
        }, 1);
        break;
      default:
        break;
    }
  }

  private handleClick() {
    const entry: InteractableElement = this.foundElems[this.currentIndex];
    if (!this.onNavigation) return;
    if (entry.elem.classList.contains(this.disabledClass)) return;

    if (entry.type === ElementType.TAB) {
      const tabList = this.givenId.find(i => i.id === entry.id.substring(0, entry.id.lastIndexOf('-')));
      if (!tabList.tabElements || tabList.tabElements.length === 0) return entry.elem.click();
      const id = tabList.tabElements[Number(entry.id.substring(entry.id.lastIndexOf('-') + 1, entry.id.length)) - 1];
      entry.elem.click();
      if (entry.onClick && entry.onClick.length > 0)
        setTimeout(() => {
          entry.onClick.map(c => document.getElementById(c.id)[c.action]());
        }, 1);
      document.getElementById(id).focus();
    } else {
      entry.elem.click();
      if (entry.onClick && entry.onClick.length > 0)
        // To avoid to trigger click on button when focusing a new element
        setTimeout(() => {
          entry.onClick.map(c => document.getElementById(c.id)[c.action]());
        }, 1);
    }
  }
}
