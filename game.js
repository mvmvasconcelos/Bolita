//o jogo em si
var game;

//opções globais
var gameOptions = {

	//altura do painel de puntuação / altura do jogo
	alturaPainelPontos: 0.08,

	//altura do painel de lançamento / altura do jogo
	alturaPainelLancamento: 0.18,

	//tamanho da bola / altura do jogo
	tamanhoBola: 0.04,

	//velocidade da bola em pixels/segundo
	velocidadeBola: 1000
}

//quando a janela carrega
window.onload = function () {

	//Cria o jogo
	game = new Phaser.Game(640, 960, Phaser.CANVAS);

	//Adiciona o state "Playgame" ao jogo e executa-o
	game.state.add("PlayGame", playGame, true);
}

//State "PlayGame"
var playGame = function(){}
playGame.prototype = {
	

	preload: function() {
	
		//Carrega os gráficos
		game.load.image("bola", "assets/bola.png");
		game.load.image("painel", "assets/painel.png");
		game.load.image("trajetoria", "assets/trajetoria.png");
	},
	

	create: function(){
	
		//Configurações de escala e background
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = 0x202020;

        //Inicializa o sistema de físca ARCADE
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //Posiciona placar de pontuação
        var placarPontos = game.add.image(0, 0, "painel");
        placarPontos.width = game.width;
        placarPontos.height = Math.round(game.height * gameOptions.alturaPainelPontos);
		
		//Posiciona painel de lançamento
		this.painelLancamento = game.add.sprite(0, game.height, "painel");
		this.painelLancamento.width = game.width;
		this.painelLancamento.height = Math.round(game.height * gameOptions.alturaPainelLancamento);        
		this.painelLancamento.anchor.set(0, 1);

		//Habilita ARCADE physics no painel de lançamento
		game.physics.enable(this.painelLancamento, Phaser.Physics.ARCADE);
	
		//Painel de lançamento não se move
		this.painelLancamento.body.immovable = true;

		//Posiciona a bola
		var tamanhoBola = game.width * gameOptions.tamanhoBola;
		this.bola = game.add.sprite(game.width / 2, game.height - this.painelLancamento.height - tamanhoBola / 2, "bola");
		this.bola.width = tamanhoBola;
		this.bola.height = tamanhoBola;
		this.bola.anchor.set(0.5);

		//Habilita ARCADE physics no painel de lançamento
		game.physics.enable(this.bola, Phaser.Physics.ARCADE);

		//A bola vai colidir com os limites da tela
		this.bola.body.collideWorldBounds = true;
		this.bola.body.bounce.set(1);

		//Posicionar a trajetória
		this.trajetoria = game.add.sprite(this.bola.x, this.bola.y, "trajetoria");
		this.trajetoria.anchor.set(0.5, 1);
		this.trajetoria.visible = false;

		//Aguarda por input do jogador
		game.input.onDown.add(this.mirarBola, this);
		game.input.onUp.add(this.atirarBola, this);
		game.input.addMoveCallback(this.ajustarBola, this);

		//o jogador não está mirando
		this.mirando = false;
	
		//o jogador não está atirando
		this.atirando = false;
	},

	mirarBola: function(e) {
		//se o jogador não está atirando
		if (!this.atirando) {
		
			//o jogador está atirando
			this.mirando = true;
		}
	},

	ajustarBola: function(e) {
		
		//se o jogador está mirando
		if (this.mirando) {
		
			//Verifica a distancia entre a posição inicial e atual do input
			var distX = e.position.x - e.positionDown.x;
			var distY = e.position.y - e.positionDown.y;
		
			//Uma distância vertical de no mínimo 10 pixels é necessária
			if (distY > 10) {
			
				//coloca a trajetoria sobre a bola
				this.trajetoria.position.set(this.bola.x, this.bola.y);
					
				//exibe a trajetória
				this.trajetoria.visible = true;
			
				//calcula a direção
				this.direcao = Phaser.Math.angleBetween(e.position.x, e.position.y, e.positionDown.x, e.positionDown.y);
			
				//austa a trajetoria do ângulo de acordo com a direção em graus
				this.trajetoria.angle = Phaser.Math.radToDeg(this.direcao) + 90;
			} 
			else {
			
				//Esconde a trajetória
				this.trajetoria.visible = false;
			}
		}
	},
	
	atirarBola: function () {
		//se a trajetória estiver visível
		if (this.trajetoria.visible) {
		
			//pega o ângulo do tiro em radianos
			var anguloDoTiro = Phaser.Math.degToRad(this.trajetoria.angle - 90);

			//define a velocidade da bola
			this.bola.body.velocity.set(gameOptions.velocidadeBola * Math.cos(anguloDoTiro), gameOptions.velocidadeBola * Math.sin(anguloDoTiro));

			//o jogador está atirando
			this.atirando = true;
		}

		//Não mire mais
		this.mirando = false;

		//não exiba a trajetoria
		this.trajetoria.visible = false;
	},

	update: function(){

		//se o jogador estiver atirando
		if (this.atirando) {

			//verifica por colisao entre a bola e o painel de lançamento
			game.physics.arcade.collide(this.bola, this.painelLancamento, function(){

				//para a bola
				this.bola.body.velocity.set(0);

				//o jogador não está atirando
				this.atirando = false;
			}, null, this);
		}
	}
}