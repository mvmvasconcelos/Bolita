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
	velocidadeBola: 1000,

	//blocos por linha
	blocosPorLinha: 7,

	//Quantidade máxima de blocos por linha:
	maxBlocosPorLinha: 4
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
		game.load.image("bloco", "assets/bloco.png");
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
        this.placarPontos = game.add.sprite(0, 0, "painel");
        this.placarPontos.width = game.width;
        this.placarPontos.height = Math.round(game.height * gameOptions.alturaPainelPontos);

		//Habilita ARCADE physics no placar de pontos
		game.physics.enable(this.placarPontos, Phaser.Physics.ARCADE);
	
		//Placar de pontos não se move
		this.placarPontos.body.immovable = true;

		
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

		//Adiciona o grupo onde todos os blocos serão posicionados
		this.grupoBlocos = game.add.group();

		//Posiciona uma nova linha de blocos
		this.colocarLinha();
	},

	colocarLinha: function() {

		//Determina o tamanho do bloco
		var tamanhoBloco = game.width / gameOptions.blocosPorLinha;

		//Array de posições pegas por um bloco
		var blocosColocados = [];

		//Repete "maxBlocosPorLinha" vezes
		for (var i = 0; i < gameOptions.maxBlocosPorLinha; i++) {
			
			//Escolhe uma posição aleatória
			var posicaoBloco = game.rnd.between(0, gameOptions.blocosPorLinha - 1);

			//Se a posição aleatória estiver livre..
			if (blocosColocados.indexOf(posicaoBloco) == -1) {

				//Insira a posição no array da posição já colocada
				blocosColocados.push(posicaoBloco);

				//Adiciona o bloco
				var bloco = game.add.sprite(posicaoBloco * tamanhoBloco + tamanhoBloco / 2, tamanhoBloco / 2 + game.height * gameOptions.alturaPainelPontos, "bloco");
				bloco.width = tamanhoBloco;
				bloco.height = tamanhoBloco;
				bloco.anchor.set(0.5);

				//Habilita ARCADE Physics no bloco
				game.physics.enable(bloco, Phaser.Physics.ARCADE);

				//O bloco não se move
				bloco.body.immovable = true;

				//Propriedade personalizavel. Bloco começa na linha 1
				bloco.row = 1;

				//Adiciona o bloco ao grupo de blocos
				this.grupoBlocos.add(bloco);
			}
		}
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

			//verifica por colisão entre a bola e o placar de pontos
			game.physics.arcade.collide(this.bola, this.placarPontos);

			//verifica por colisão entre a bola e childrens do grupoBlocos
			game.physics.arcade.collide(this.bola, this.grupoBlocos, function(bola, bloco){

				//destrói o bloco
				bloco.destroy();
			}, null, this);

			//verifica por colisao entre a bola e o painel de lançamento
			game.physics.arcade.collide(this.bola, this.painelLancamento, function(){

				//para a bola
				this.bola.body.velocity.set(0);

				//usa um tween para baixar o grupo de blocos
				var baixarTween = game.add.tween(this.grupoBlocos).to({
					y: this.grupoBlocos.y + game.width / gameOptions.blocosPorLinha
				}, 200, Phaser.Easing.Linear.None, true);

				//quando o tween completar
				baixarTween.onComplete.add(function(){

					//o jogador não está atirando
					this.atirando = false;

					//coloca o grupo na posição original
					this.grupoBlocos.y = 0;

					//passa por todos os childrens do grupoBlocos
					this.grupoBlocos.forEach(function(i){

						//ajusta a posição vertical
						i.y += game.width / gameOptions.blocosPorLinha;

						//incrementa a linha
						i.row++;

						//se um bloco estiver muito próximo da bola
						if (i.row == gameOptions.blocosPorLinha) {

							//Reinicia o gameOptions
							game.state.start("PlayGame");
						}
					}, this);

					//adiciona um anova linha
					this.colocarLinha();
					
				}, this)

			}, null, this);
		}
	}
}