import "babel-polyfill";
import Ptt from "./Ptt";
import dom, { Fragment } from 'jsx-render';

const account = {
	username: "guest",
	password: "guest",
	logout_dup: false,
	delete_try_log: true
};

(async function () {
	const ptt = new Ptt();
	const userStatus = (<a class="right small" href="#!">連線中...</a>);
	topbar.appendChild(userStatus);
	ptt.on("login", success => userStatus.innerText = success ? `我是 ${account.username}` : "登入失敗 QQ");
	ptt.on("connect", () => userStatus.innerText = "連線成功，登入中...");

	const favoriteBtn = (<a class="btn" href="#">最愛看版</a>);
	favoriteBtn.onclick = async () => {
		if (!ptt.state.login) {
			alert("還在登入欸");
			return;
		}
		const boardList = document.querySelector(".b-list-container");
		boardList.innerHTML = "";

		ptt.state.login && ptt.getFavorite()
			.then(list => {
				list.forEach(board => {
					switch (board.type) {
						case "board":
							boardList.appendChild(
								<div class="b-ent">
									<a class="board" data-href={`/bbs/${board.boardname}/index.html`} href="#!">
										<div class="board-name">{board.boardname}</div>
										<div class="board-nuser"><span class="hl">{board.nuser}</span></div>
										<div class="board-class">{board.class}</div>
										<div class="board-title">{board.title}</div>
									</a>
								</div>
							)
							break;
						case "divider":
							boardList.appendChild(<div class="b-ent"><hr /></div>);
							break;
						case "folder":
						case "group":
							boardList.appendChild(
								<div class="b-ent">
									<a class="board">
										<div class="board-name">{board.boardname}</div>
										<div class="board-nuser"><span class="hl">{board.nuser}</span></div>
										<div class="board-class">{board.class}</div>
										<div class="board-title">{board.title}</div>
									</a>
								</div>
							)
							break;
						default:
							break;
					}
				}
				)

			})
	};
	document.querySelector('.btn-group-cls').appendChild(favoriteBtn);

	await ptt.connect();
	!ptt.state.login && await ptt.login(account);
})();
