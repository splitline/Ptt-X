import "babel-polyfill";
import Ptt from "./Ptt";
import alertify from 'alertifyjs';

import React, { Component, Fragment } from "react";
import ReactDOM, { render, createPortal, findDOMNode } from "react-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { contextMenu, Menu, Item, theme } from 'react-contexify';

const ptt = new Ptt();
global.account = {};

const appendReactDom = (elem, component) => {
	render(createPortal(component, elem), document.createElement("div"));
};

/**
|--------------------------------------------------
| UI & Ptt events
|--------------------------------------------------
*/

const boardList = document.querySelector(".b-list-container");

class TopBar extends Component {
	constructor() {
		super();
		this.state = { message: "連線中" };
	}

	componentWillMount() {
		ptt.on("login", success => {
			if (success) {
				alertify.success("登入成功");
				this.setState({ message: `我是 ${account.username}` });
			} else {
				alertify.error("登入失敗 QQ");
				this.setState({ message: "登入失敗 QQ" });
			}
		});
		ptt.on("connect", () => this.setState({ message: "連線成功，登入中..." }));
		ptt.on("disconnect", () => {
			alertify.error("斷線了 88888");
			this.setState({ message: "斷線了，點此重新連線" });
		});
	}

	reconnect() {
		if (!ptt.state.connect) {
			ptt.socket.reconnect();
			initPtt(account);
		}
	}

	render() {
		return <a className="right small" href="#!" onClick={this.reconnect}>{this.state.message}</a>;
	}
}

class FavoriteBoards extends Component {
	constructor(props) {
		super(props);
		this.state = { boards: [], loading: true, queryResult: [], queryStr: "", lock: false };
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);

		this.appendDivider = this.appendDivider.bind(this);
		this.appendFolder = this.appendFolder.bind(this);
		this.deleteEntry = this.deleteEntry.bind(this);

		this.menuId = "b-ent-context-menu";
	}

	componentDidMount() {
		this.init();
	}

	init() {
		ptt.waitForInit()
			.then(() => ptt.getFavorite())
			.then(list => {
				this.setState({ boards: list, loading: false });
			});
	}

	onContextMenu(event) {
		event.stopPropagation();
		event.preventDefault();
		contextMenu.show({
			id: this.menuId,
			event,
			props: {
				id: event.currentTarget.dataset.id
			}
		})
	}

	onDragEnd(result) {
		this.setState({ dragging: false });
		if (!result.destination || result.source.index === result.destination.index)
			return;

		const reorder = (list, startIndex, endIndex) => {
			const result = Array.from(list);
			const [removed] = result.splice(startIndex, 1);
			result.splice(endIndex, 0, removed);

			return result;
		};

		const boards = reorder(
			this.state.boards,
			result.source.index,
			result.destination.index
		);

		ptt.changeFavoriteOrder(result.source.index + 1, result.destination.index + 1);

		this.setState({ boards });
	}

	appendDivider({ props }) {
		ptt.favoriteAppendDivider(props.id);
		const { boards } = this.state;
		boards.splice(props.id - 1, 0, {
			id: boards.length + 1,
			boardname: "",
			type: "divider"
		});
		this.setState({ boards });
	}

	appendFolder({ props }) {
		ptt.favoriteAppendFolder(props.id);
		const { boards } = this.state;
		boards.splice(props.id - 1, 0, {
			id: boards.length + 1,
			boardname: "MyFavFolder",
			class: "目錄",
			title: "□新的目錄",
			type: "folder"
		});
		this.setState({ boards });
	}

	deleteEntry({ props }) {
		alertify.confirm("確定要刪除此看板嗎？", () => {
			ptt.favoriteDeleteEntry(props.id);
			const { boards } = this.state;
			boards.splice(props.id - 1, 1);
			this.setState({ boards });
		})
	}

	addFavorite(value = "", queryOnly = true) {
		this.setState({ lock: true });
		if (!queryOnly)
			this.setState({ queryStr: "", queryResult: [] })
		if (value.trim() !== "")
			ptt.addFavorite(value, queryOnly)
				.then((result) => {
					this.setState({ lock: false });
					if (queryOnly)
						this.setState({ queryResult: result });
					else
						this.init();
				})
	}

	render() {
		return (
			this.state.loading ?
				<div style={{ margin: 'auto', width: 'fit-content' }}><div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>
				:
				<Fragment>
					<div className="search-bar" style={{ position: 'relative' }}>
						<input className="query" type="text" placeholder="新增看板..." onChange={e => this.setState({ queryStr: e.target.value })} autoComplete="off" value={this.state.queryStr} style={{ width: "90%" }} />
						<button className="btn"
							disabled={this.state.lock}
							onClick={e => this.addFavorite(this.state.queryStr, true)}
							style={{
								width: "10%",
								padding: "0.8ex",
								fontSize: 'inherit'
							}}>搜尋</button>
						<div style={{
							position: "absolute",
							backgroundColor: "#222",
							width: "100%",
							zIndex: 1,
							maxHeight: "12em",
							overflow: 'scroll'
						}}>
							{this.state.queryResult.map((board, i) =>
								<div className="b-ent" key={i} onClick={e => this.addFavorite(board, false)}>
									<a className="board" href="#!">
										<div className="board-name">{board}</div>
									</a>
								</div>
							)}
						</div>
					</div>
					<DragDropContext onDragEnd={this.onDragEnd}>
						<Droppable droppableId="boards">
							{provided => (
								<div ref={provided.innerRef}>
									{this.state.boards.map((item, index) => (
										<Draggable key={index} draggableId={item.boardname + index} index={index} >
											{provided => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
												>
													<BoardEntry
														board={{ ...item, id: index + 1 }}
														onContextMenu={this.onContextMenu}
													/>
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
					<Menu id={this.menuId} theme={theme.dark}>
						<Item onClick={this.appendDivider}>在上方插入分隔線</Item>
						<Item onClick={this.appendFolder}>在上方插入目錄</Item>
						<Item onClick={this.deleteEntry}>刪除</Item>
					</Menu>
				</Fragment >
		);
	}
}

class BoardEntry extends Component {
	state = {
		editing: false
	}

	render() {
		const { board, onContextMenu } = this.props;
		return (
			<div className="b-ent" onContextMenu={onContextMenu} data-id={board.id}>
				<a className="board" href={`/bbs/${board.boardname}/index.html`}>
					{board.type === 'divider' ?
						(<div className="board-divider"></div>) :
						(<Fragment>
							<div className="board-name">{board.boardname}</div>
							<div className="board-nuser"><span className="hl">{board.nuser}</span></div>
							<div className="board-class">{board.class}</div>
							<div className="board-title">{board.title}</div>
						</Fragment>)
					}
				</a>
			</div >
		)
	}
}

class ActionBar extends Component {
	constructor() {
		super();
		this.getHotBoard = this.getHotBoard.bind(this);
		this.getCls = this.getCls.bind(this);

		this.state = {
			active: 0
		}
	}

	ajaxGetContent(url) {
		ReactDOM.unmountComponentAtNode(boardList);
		boardList.innerHTML = '<div style="margin:auto;width:fit-content;"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>';
		fetch(url)
			.then(r => r.text())
			.then(html => {
				const elem = document.createElement('html');
				elem.innerHTML = html;
				boardList.innerHTML = elem.querySelector(".b-list-container").innerHTML;
			});
	}

	getFavorites() {
		render(<FavoriteBoards />, boardList);
	}

	getHotBoard() {
		this.ajaxGetContent("/bbs/hotboards.html");
	}

	getCls() {
		this.ajaxGetContent("/cls/1");
	}

	render() {
		const menuItems = [
			{ text: "熱門看板", handler: this.getHotBoard },
			{ text: "最愛看板", handler: this.getFavorites },
			{ text: "分類看板", handler: this.getCls }
		];
		return (<div id="action-bar-container">
			<div className="action-bar">
				<div className="btn-group btn-group-cls">
					{menuItems.map((item, index) =>
						<a
							className={`btn${this.state.active === index ? " selected" : ""}`}
							key={index}
							onClick={() => {
								this.setState({ active: index });
								item.handler();
							}}>
							{item.text}
						</a>
					)}
				</div>
			</div>
		</div>)
	}
}

appendReactDom(topbar, <TopBar />);
render(<ActionBar />, document.getElementById('action-bar-container'));

/**
|--------------------------------------------------
| Init Extension
|--------------------------------------------------
*/

const initPtt = async (account) => {
	global.account = account;
	console.log("initPtt");
	await ptt.connect();
	console.log("login");
	const result = await ptt.login(account);
	if(result) chrome.storage.sync.set({ account: account });
}

chrome.storage.sync.get({ account: null }, async (data) => {
	if (!data.account)
		alertify.confirm("設定 Ptt 帳號",
			`<div>
							<label htmlFor="ptt-id"> ID </label>
							<input class="ajs-input" type="text" id="ptt-username" />
							<label htmlFor="ptt-password"> 密碼 </label>
							<input class="ajs-input" type="password" id="ptt-password" />
							<input type="checkbox" id="ptt-logout-dup" checked />
							<label for="ptt-logout-dup">刪除其他重複登入的連線</label>
							<input type="checkbox" id="ptt-delete-try-log" checked />
							<label for="ptt-delete-try-log">刪除登入錯誤嘗試的記錄</label>
						</div>`
			, () => {
				account = {
					username: document.getElementById("ptt-username").value,
					password: document.getElementById("ptt-password").value,
					logout_dup: document.getElementById('ptt-logout-dup').checked,
					delete_try_log: document.getElementById('ptt-delete-try-log').checked
				};
				initPtt(account);
			}, () => undefined)
			.setting({
				closable: false,
				labels: { ok: '設定並登入', cancel: '下次再說' },
			});
	else
		initPtt(data.account);
});