import PttSocket from './PttSocket';
import {
	KEYS
} from './utils';
import Terminal from 'terminal.js';
import sleep from 'sleep-promise';
import {
	EventEmitter
} from 'events';

export default class Ptt extends EventEmitter {
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
		this.socket
			.on("connect", () => this.emit("connect"))
			.on("message", (data) => {
				this.term.write(data);
				console.log(this.term.toString());
			});
	}

	async connect() {
		return new Promise(resolve => {
			this.on('connect', () => {
				this.state.connect = true;
				resolve();
			});
		});
	}

	async login(account) {
		await this.socket.sendline(account.username + "\r" + account.password);
		let ret = null,
			_;
		return new Promise(resolve => {
			this.socket.on("message", (_ = async (data) => {
				ret = await this.isLogin(data, account);
				if (typeof ret === "boolean") {
					this.state.login = ret;
					this.emit("login", ret);
					this.socket.removeListener("message", _);
					resolve(ret);
				}
			}));
		});
	}

	async isLogin(term, {
		logout_dup = true,
		delete_try_log = true
	}) {
		if (term.includes("密碼不對或無此帳號")) {
			return false;
		} else if (term.includes("抱歉，目前已有太多 guest 在站上")) {
			return false;
		} else if (term.includes("您想刪除其他重複登入的連線嗎")) {
			await this.socket.sendline(logout_dup ? "Y" : "n");
		} else if (term.includes("請勿頻繁登入以免造成系統過度負荷")) {
			await this.socket.sendline();
		} else if (term.includes("按任意鍵繼續")) {
			await this.socket.sendline();
		} else if (term.includes("您要刪除以上錯誤嘗試的記錄嗎")) {
			await this.socket.sendline(delete_try_log ? "Y" : "n");
		} else if (term.includes("我是")) {
			return true;
		}
		return null;
	}

	async getFavorite() {
		const typeMap = {
			"◎": "board",
			"Σ": "group",
			"□": "folder",
			"--" : "divider"
		};
		await this.socket.send(KEYS.CtrlZ + "f" + KEYS.Home);
		const favorites = [];
		let firstId = -1,
			endOfList = false;
		while (true) {
			await sleep(50);
			for (let i = 3; i < 23; i++) {
				let line = this.term.getLine(i);
				if (line.trim() === '') break;
				let favorite = {
					id: line.substrWidth(3, 4).trim() | 0,
					read: line.substrWidth(8, 2).trim() === '',
					boardname: line.substrWidth(10, 12).trim(),
					class: line.substrWidth(23, 4).trim(),
					type: typeMap[line.substrWidth(28, 2).trim()],
					sign: line.substrWidth(28, 2).trim(),
					title: line.substrWidth(28, 31),
					nuser: parseInt(line.substrWidth(62, 5).trim()) || line.substrWidth(62, 5).trim(),
					admin: line.substrWidth(67).trim(),
				};
				if (i === 3) {
					if (firstId === favorite.id) {
						endOfList = true;
						break;
					}
					firstId = favorite.id;
				}
				favorites.push(favorite);
			}
			if (endOfList) break;
			await this.socket.send(KEYS.PgDown);
		}
		return favorites;
	}
}