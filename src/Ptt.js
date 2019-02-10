import PttSocket from './PttSocket';
import {
	KeyMap
} from './utils';
import Terminal from 'terminal.js';
import sleep from 'sleep-promise';
import {
	EventEmitter
} from 'events';

export default class Ptt extends EventEmitter {
	static SocketEvents = [
		'connect',
		'disconnect',
		'message',
		'error',
	];

	static typeMap = {
		"◎": "board",
		"Σ": "group",
		"□": "folder",
		"--": "divider"
	};

	static switchTo = {
		// aricles: "b",
		category: "c",
		trend: "t",
		favorites: "f",
		mailbox: "m",
		users: "u"
	}

	constructor() {
		super();
		this.state = {
			connect: false,
			login: false
		};
		this.socket = new PttSocket("wss://ws.ptt.cc/bbs/");
		this.term = new Terminal({
			columns: 80,
			rows: 24,
		});
		this.term.state.setMode('stringWidth', 'dbcs');
		this.term.getLine = i => this.term.state.getLine(i).str;
		this.on("message", (data) => {
				this.term.write(data);
				console.log(this.term.toString());
			})
			.on("connect", () => this.state.connect = true)
			.on("disconnect", () => this.state.connect = this.state.login = false);

		Ptt.SocketEvents.forEach(e => this.socket.on(e, this.emit.bind(this, e)));
	}

	async connect() {
		return this.state.connect || new Promise(resolve => {
			this.on('connect', () => {
				resolve();
			});
		});
	}

	async login(account) {
		if (this.state.login) return;
		this.sendline(account.username + "\r" + account.password);
		let ret = null,
			_;
		return new Promise(resolve => {
			this.on("message", (_ = async (data) => {
				ret = await this.isLogin(data, account);
				if (typeof ret === "boolean") {
					this.state.login = ret;
					this.emit("login", ret);
					this.removeListener("message", _);
					resolve(ret);
				}
			}));
		});
	}

	async isLogin(term, {
		logout_dup = true,
		delete_try_log = true
	}) {
		if (term.includes("密碼不對")) {
			return false;
		} else if (term.includes("抱歉，目前已有太多 guest 在站上")) {
			return false;
		} else if (term.includes("登入太頻繁")) {
			return false;
		} else if (term.includes("您想刪除其他重複登入的連線嗎")) {
			await this.sendline(logout_dup ? "Y" : "n");
		} else if (term.includes("請勿頻繁登入以免造成系統過度負荷")) {
			await this.send(" ");
		} else if (term.includes("按任意鍵繼續")) {
			await this.send(" ");
		} else if (term.includes("您要刪除以上錯誤嘗試的記錄嗎")) {
			await this.sendline(delete_try_log ? "Y" : "n");
		} else if (term.includes("主功能表")) {
			return true;
		}
		return null;
	}

	async getBoardList() {
		const list = [];
		let firstId = -1,
			endOfList = false;
		while (!this.term.toString().includes("看板列表")) await sleep(100);
		while (true) {
			for (let i = 3; i < 23; i++) {
				let line = this.term.getLine(i);
				if (line.trim() === '') break;
				let item = {
					id: line.substrWidth(3, 4).trim() | 0,
					read: line.substrWidth(8, 2).trim() === '',
					boardname: line.substrWidth(10, 12).trim(),
					class: line.substrWidth(23, 4).trim(),
					type: Ptt.typeMap[line.substrWidth(28, 2).trim()],
					sign: line.substrWidth(28, 2).trim(),
					title: line.substrWidth(28, 31),
					nuser: parseInt(line.substrWidth(62, 5).trim()) || line.substrWidth(62, 5).trim(),
					admin: line.substrWidth(67).trim(),
				};
				if (i === 3) {
					if (firstId === item.id) {
						endOfList = true;
						break;
					}
					firstId = item.id;
				}
				list.push(item);
			}
			if (endOfList) break;
			await this.send(KeyMap.PageDown);
		}

		this.send(KeyMap.Home);
		return list;
	}

	async addFavorite(searchStr, queryOnly = true) {
		searchStr = searchStr.trim();
		if (!this.term.toString().includes("看板列表"))
			await this.send(KeyMap.CtrlZ + "f");
		await this.send("a");
		while (!this.term.toString().includes("我的最愛")) await sleep(100);
		await this.send(searchStr + (queryOnly ? " " : KeyMap.Enter));
		if (!queryOnly) return true;

		let queryResult = [];
		const matchedResult = this.term.getLine(1).substrWidth(42, 12).trim();
		if (matchedResult !== searchStr) {
			console.log("matched")
			queryResult.push(matchedResult);
			this.sendline(KeyMap.Backspace.repeat(matchedResult.length));
			return queryResult;
		}
		for (let i = 3; i < 23; i++) {
			const line = this.term.getLine(i);
			let boards = line.split(/\s+/).filter(i => i.trim() !== "");
			queryResult = queryResult.concat(boards);
		}
		this.sendline(KeyMap.Backspace.repeat(searchStr.length));
		return queryResult;
	}
	async getFavorite() {
		if (!this.term.toString().includes("看板列表"))
			await this.send(KeyMap.CtrlZ + "f");
		const list = await this.getBoardList();
		return list;
	}

	async getFavoriteFolder(entryId) {
		await this.send(`${KeyMap.CtrlZ}f${entryId}${KeyMap.Enter}${KeyMap.Home}`);
		const list = await this.getBoardList();
		return list;
	}

	changeFavoriteOrder(originId, newId) {
		this.send(KeyMap.CtrlZ + "f");
		this.sendline(originId);
		this.send("M");
		this.sendline(newId);
		this.send(KeyMap.Home);
	}

	favoriteAppendDivider(lineId) {
		this.send(KeyMap.CtrlZ + "f");
		this.sendline(lineId);
		this.send("L");
		this.send(KeyMap.Home);
	}

	favoriteAppendFolder(lineId) {
		this.send(KeyMap.CtrlZ + "f");
		this.sendline(lineId);
		this.send("g");
		this.send(KeyMap.Home);
	}

	favoriteDeleteEntry(lineId) {
		this.send(KeyMap.CtrlZ + "f");
		this.sendline(lineId);
		this.send("d");
		this.sendline("y");
		this.send(KeyMap.Home);
	}

	async waitForInit() {
		if (this.state.connect && this.state.login) return;
		else return new Promise(resolve => {
			this.on("login", resolve);
		})
	}

	async send(data) {
		!data.endsWith("\r") && console.log("SEND:", data);
		return new Promise(resolve => {
			this.socket.send(data);
			this.once('message', () => setTimeout(resolve, 100));
		});
	}

	async sendline(data) {
		console.log("SENDLINE:", data);
		return this.send(data + "\r");
	}
}