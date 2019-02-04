import "babel-polyfill";
import Ptt from "./Ptt";
import dom, { Fragment } from 'jsx-render';
import * as toastr from 'toastr';
import alertify from 'alertifyjs';

const ptt = new Ptt();
global.account = {};

const userStatus = (<a class="right small" href="#!">連線中...</a>);
userStatus.setStatus = (message) => userStatus.textContent = message;
topbar.appendChild(userStatus);

ptt.on("login", success => {
	if (success) {
		toastr.success("登入成功");
		userStatus.setStatus(`我是 ${account.username}`);
	} else {
		toastr.error("登入失敗 QQ");
		userStatus.setStatus("登入失敗 QQ");
	}
});
ptt.on("connect", () => userStatus.setStatus("連線成功，登入中..."));
ptt.on("disconnect", () => toastr.error("斷線了 88888"));

const favoriteBtn = (<a class="btn" href="#">最愛看版</a>);
favoriteBtn.onclick = async () => {
	if (!ptt.state.login) {
		toastr.warning("還沒登入欸")
		return;
	}
	const boardList = document.querySelector(".b-list-container");
	boardList.innerHTML = '<div style="margin:auto;width:fit-content;"><div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div>';

	ptt.state.login && ptt.getFavorite()
		.then(list => {
			boardList.innerHTML = "";
			list.forEach(board => {
				switch (board.type) {
					case "board":
						boardList.appendChild(DragDroper(
							<div class="b-ent" id={`favorite-${board.id}`} data-id={board.id} draggable>
								<a class="board" data-href={`/bbs/${board.boardname}/index.html`}>
									<div class="board-name">{board.boardname}</div>
									<div class="board-nuser"><span class="hl">{board.nuser}</span></div>
									<div class="board-class">{board.class}</div>
									<div class="board-title">{board.title}</div>
								</a>
							</div>
						));
						break;
					case "divider":
					case "folder":
					case "group":
						boardList.appendChild(DragDroper(
							<div class="b-ent" id={`favorite-${board.id}`} data-id={board.id} draggable>
								<a class="board">
									<div class="board-name">{board.boardname}</div>
									<div class="board-nuser"><span class="hl">{board.nuser}</span></div>
									<div class="board-class">{board.class}</div>
									<div class="board-title">{board.title}</div>
								</a>
							</div>
						));
						break;
					default:
						break;
				}
			})
		})
};
document.querySelector('.btn-group-cls').appendChild(favoriteBtn);

/**
|--------------------------------------------------
| Drag Drop Functions
|--------------------------------------------------
*/

var dragSrcEl = null;
function handleDragStart(e) {
	this.style.opacity = 0.4;
	dragSrcEl = e.target;
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', this.id);
}
function handleDragOver(e) {
	e.preventDefault();
	this.style.borderTop = "2px solid gray";
	e.dataTransfer.dropEffect = 'move';
	return false;
}
function handleDragLeave(e) {
	this.style.borderTop = "";
}
function handleDrop(e) {
	e.stopPropagation();
	if (dragSrcEl != this) {
		var sourceId = e.dataTransfer.getData('text/plain');
		this.parentNode.insertBefore(document.getElementById(sourceId), this);
		var dropElem = this.previousSibling;
		if (dragSrcEl.dataset.id < this.dataset.id)
			ptt.changeFavoriteOrder(dragSrcEl.dataset.id, this.dataset.id - 1);
		else
			ptt.changeFavoriteOrder(dragSrcEl.dataset.id, this.dataset.id);
		console.log("order", dragSrcEl.dataset.id, this.dataset.id);
		DragDroper(dropElem);

		document.querySelectorAll(".b-ent").forEach((elem, i) => {
			elem.dataset.id = i + 1;
		});
	}
	this.style.borderTop = "";
	return false;
}
function handleDragEnd(e) {
	if (dragSrcEl) dragSrcEl.style.opacity = "";
	this.style.borderTop = "";
}
function DragDroper(elem) {
	elem.addEventListener('dragstart', handleDragStart, false);
	elem.addEventListener('dragover', handleDragOver, false);
	elem.addEventListener('dragleave', handleDragLeave, false);
	elem.addEventListener('drop', handleDrop, false);
	elem.addEventListener('dragend', handleDragEnd, false);
	return elem;
}

// ============================================================

const initPtt = async (account) => {
	global.account = account;
	!ptt.state.connect && await ptt.connect();
	!ptt.state.login && await ptt.login(account);
}

chrome.storage.sync.get({ account: null }, async (data) => {
	if (!data.account) {
		alertify.confirm(
			"設定 Ptt 帳號",
			<div>
				<label htmlFor="ptt-id"> ID </label>
				<input class="ajs-input" type="text" id="ptt-username" />
				<br />
				<label htmlFor="ptt-password"> 密碼 </label>
				<input class="ajs-input" type="password" id="ptt-password" />

				<input type="checkbox" id="ptt-logout-dup" checked />
				<label for="ptt-logout-dup">刪除其他重複登入的連線</label>

				<input type="checkbox" id="ptt-delete-try-log" checked />
				<label for="ptt-delete-try-log">刪除登入錯誤嘗試的記錄</label>
			</div>
			, () => {
				account = {
					username: document.getElementById("ptt-username").value,
					password: document.getElementById("ptt-password").value,
					logout_dup: document.getElementById('ptt-logout-dup').checked,
					delete_try_log: document.getElementById('ptt-delete-try-log').checked
				};
				chrome.storage.sync.set({ account: account });
				initPtt(account);
			}, () => null);
	}
	else
		initPtt(data.account);
});