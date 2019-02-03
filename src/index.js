import "babel-polyfill";
import Ptt from "./Ptt";
import dom, { Fragment } from 'jsx-render';
import * as toastr from 'toastr';

const account = {
	username: "guest",
	password: "guest",
	logout_dup: false,
	delete_try_log: true
};

const ptt = new Ptt();
ptt.on("login", success => {
	if (success) {
		toastr.success("登入成功");
		userStatus.innerText = `我是 ${account.username}`;
	} else {
		toastr.error("登入失敗 QQ");
		userStatus.innerText = "登入失敗 QQ";
	}
});
ptt.on("connect", () => userStatus.innerText = "連線成功，登入中...");
ptt.on("disconnect", () => toastr.error("斷線了 88888"));

const userStatus = (<a class="right small" href="#!">連線中...</a>);
topbar.appendChild(userStatus);

const favoriteBtn = (<a class="btn" href="#">最愛看版</a>);
favoriteBtn.onclick = async () => {
	if (!ptt.state.login) {
		toastr.warning("還在登入欸")
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

// drag drop board
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

(async function () {
	// start ptt
	await ptt.connect();
	!ptt.state.login && await ptt.login(account);
})();