var game;
var gameOptions = {
    alturaPontos: 0.08,
    alturaPainelLancamento: 0.18,
    tamanhoBola: 0.04,
    velocidadeBola: 1000,
    blocosPorLinha: 10,
    maxBlocosPorLinha: 4,
    probabilidadeBolaExtra: 60
}
window.onload = function() {
    game = new Phaser.Game(640, 960, Phaser.CANVAS);
    game.state.add("PlayGame", playGame, true);
}
var playGame = function(){}
playGame.prototype = {
	preload: function(){
        game.load.image("bola", "assets/bola.png");
        game.load.image("painel", "assets/painel.png");
        game.load.image("trajetoria", "assets/trajetoria.png");
        game.load.image("bloco", "assets/bloco.png");
	},
    create: function(){
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = 0x202020;
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.grupoBlocos = game.add.group();
        this.grupoBolasExtras = game.add.group();
        this.grupoBolasASeremAdicionadas = game.add.group();
        this.grupoBolas = game.add.group();
        this.grupoCaindo = game.add.group();
        this.grupoCaindo.add(this.grupoBlocos);
        this.grupoCaindo.add(this.grupoBolasExtras);
        this.areaPontuacao = game.add.sprite(0, 0, "painel");
        this.areaPontuacao.width = game.width;
        this.areaPontuacao.height = Math.round(game.height * gameOptions.alturaPontos);
        game.physics.enable(this.areaPontuacao, Phaser.Physics.ARCADE);
        this.areaPontuacao.body.immovable = true;
        this.painelLancamento = game.add.sprite(0, game.height, "painel");
        this.painelLancamento.width = game.width;
        this.painelLancamento.height = Math.round(game.height * gameOptions.alturaPainelLancamento);
        this.painelLancamento.anchor.set(0, 1);
        game.physics.enable(this.painelLancamento, Phaser.Physics.ARCADE);
        this.painelLancamento.body.immovable = true;
        var tamanhoBola = game.width * gameOptions.tamanhoBola;
        this.adicionarBola(game.width / 2, game.height - this.painelLancamento.height - tamanhoBola / 2);
        this.trajetoria = game.add.sprite(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y, "trajetoria");
        this.trajetoria.anchor.set(0.5, 1);
        this.trajetoria.visible = false;
        game.input.onDown.add(this.mirarBola, this);
        game.input.onUp.add(this.dispararBola, this);
        game.input.addMoveCallback(this.ajustarBola, this);
        this.mirando = false;
        this.atirando = false;
        this.level = 0;
        this.adicionarLinha();
        this.bolaExtra = 0;
	},
    adicionarBola: function(x, y){
        var tamanhoBola = game.width * gameOptions.tamanhoBola;
        var bola = game.add.sprite(x, y, "bola");
        bola.width = tamanhoBola;
        bola.height = tamanhoBola;
        bola.anchor.set(0.5);
        game.physics.enable(bola, Phaser.Physics.ARCADE);
        bola.body.collideWorldBounds=true;
        bola.body.bounce.set(1);
        this.grupoBolas.add(bola);
    },
    juntarBola: function(i){
        var scrollTween = game.add.tween(i).to({
            x: this.grupoBolas.getChildAt(0).x
        }, 100, Phaser.Easing.Linear.None, true);
        scrollTween.onComplete.add(function(i){
            i.destroy();
        }, this)
    },
    adicionarLinha: function(){
        this.level ++;
        var tamanhoBloco = game.width / gameOptions.blocosPorLinha;
        var blocosColocados = [];
        var colocarBolaExtra = false;
        if(game.rnd.between(0, 99) < gameOptions.probabilidadeBolaExtra){
            colocarBolaExtra = true;
        }
        for(var i = 0; i < gameOptions.maxBlocosPorLinha; i++){
            var posicaoBloco = game.rnd.between(0, gameOptions.blocosPorLinha - 1);
            if(blocosColocados.indexOf(posicaoBloco) == -1){
                blocosColocados.push(posicaoBloco);
                if(!colocarBolaExtra){
                    var bloco = game.add.sprite(posicaoBloco * tamanhoBloco + tamanhoBloco / 2, tamanhoBloco / 2 + game.height * gameOptions.alturaPontos, "bloco");
                    bloco.width = tamanhoBloco;
                    bloco.height = tamanhoBloco;
                    bloco.anchor.set(0.5);
                    bloco.value = this.level
                    game.physics.enable(bloco, Phaser.Physics.ARCADE);
                    bloco.body.immovable = true;
                    bloco.row = 1;
                    this.grupoBlocos.add(bloco);
                    var text = game.add.text(0, 0, bloco.value, {
                        font: "bold 32px Arial",
                        align: "center"
                    });
                    text.anchor.set(0.5);
		            bloco.addChild(text);
                }
                else{
                    colocarBolaExtra = false;
                    var tamanhoBola = game.width * gameOptions.tamanhoBola;
                    var bola = game.add.sprite(posicaoBloco * tamanhoBloco + tamanhoBloco / 2, tamanhoBloco / 2 + game.height * gameOptions.alturaPontos, "bola");
                    bola.width = tamanhoBola;
                    bola.height = tamanhoBola;
                    bola.anchor.set(0.5);
                    bola.tint = 0xff8800;
                    game.physics.enable(bola, Phaser.Physics.ARCADE);
                    bola.body.immovable = true;
                    this.grupoBolasExtras.add(bola);
                    bola.row = 1;
                }
            }
        }
    },
    mirarBola: function(e){
        if(!this.atirando){
            this.mirando = true;
        }
    },
    ajustarBola: function(e){
        if(this.mirando){
            var distX = e.position.x - e.positionDown.x;
            var distY = e.position.y - e.positionDown.y;
            if(distY > 10){
                this.trajetoria.position.set(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y);
                this.trajetoria.visible = true;
                this.direction = Phaser.Math.angleBetween(e.position.x, e.position.y, e.positionDown.x, e.positionDown.y);
                this.trajetoria.angle = Phaser.Math.radToDeg(this.direction) + 90;
            }
            else {
                this.trajetoria.visible = false;
            }
        }
    },
    dispararBola: function(){
        if(this.trajetoria.visible){
            this.bolasCaidas = 0;
            var anguloDoTiro = Phaser.Math.degToRad(this.trajetoria.angle - 90);
            var posicaoDoTiro = new Phaser.Point(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y);
            var bolaDisparada = 0;
            var fireLoop = game.time.events.loop(Phaser.Timer.SECOND / 10, function(){
                bolaDisparada++;
                if(bolaDisparada > this.bolaExtra){
                    game.time.events.remove(fireLoop);
                }
                else{
                    this.adicionarBola(posicaoDoTiro.x, posicaoDoTiro.y);
                    console.log(bolaDisparada,this.grupoBolas.children.length)
                    this.grupoBolas.getChildAt(this.grupoBolas.children.length - 1).body.velocity.set(gameOptions.velocidadeBola * Math.cos(anguloDoTiro), gameOptions.velocidadeBola * Math.sin(anguloDoTiro));
                }
            }, this)
 
            this.grupoBolas.getChildAt(0).body.velocity.set(gameOptions.velocidadeBola * Math.cos(anguloDoTiro), gameOptions.velocidadeBola * Math.sin(anguloDoTiro));
            this.atirando = true;
        }
        this.mirando = false;
        this.trajetoria.visible = false;
    },
    update: function(){
        if(this.atirando){
            game.physics.arcade.collide(this.grupoBolas, this.areaPontuacao);
            game.physics.arcade.collide(this.grupoBolas, this.grupoBlocos, function(bola, bloco){
 
                bloco.value --;
                if(bloco.value == 0){
                bloco.destroy();
                }
                else{
                    bloco.getChildAt(0).text = bloco.value;
                }
            }, null, this);
            game.physics.arcade.overlap(this.grupoBolas, this.grupoBolasExtras, function(bola, extraBall){
                this.grupoBolasASeremAdicionadas.add(extraBall)
                var scrollTween = game.add.tween(extraBall).to({
                    y: game.height - this.painelLancamento.height - (game.width * gameOptions.tamanhoBola) / 2
                }, 200, Phaser.Easing.Linear.None, true);
                scrollTween.onComplete.add(function(e){
                    e.tint = 0xffffff;
                }, this)
            }, null, this);
            game.physics.arcade.collide(this.grupoBolas, this.painelLancamento, function(painel, bola){
                bola.body.velocity.set(0);
                if(this.bolasCaidas == 0){
                    this.grupoBolas.swapChildren(bola, this.grupoBolas.getChildAt(0));
                }
                else{
                    this.juntarBola(bola);
                }
                this.bolasCaidas++;
                if(this.bolasCaidas > this.bolaExtra){
                    this.grupoBolasASeremAdicionadas.forEach(function(i){
                        this.bolaExtra ++;
                        this.juntarBola(i);
                    }, this);
                    var scrollTween = game.add.tween(this.grupoCaindo).to({
                        y: this.grupoCaindo.y + game.width / gameOptions.blocosPorLinha
                    }, 200, Phaser.Easing.Linear.None, true);
                    scrollTween.onComplete.add(function(){
                        this.atirando = false;
                        this.grupoCaindo.y = 0;
                        this.grupoBlocos.forEach(function(i){
                            i.y += game.width / gameOptions.blocosPorLinha;
                            i.row++;
                            if(i.row == gameOptions.blocosPorLinha){
                                game.state.start("PlayGame");
                            }
                        }, this);
                        this.grupoBolasExtras.forEach(function(i){
                                i.y += game.width / gameOptions.blocosPorLinha;
                                i.row++;
                                if(i.row == gameOptions.blocosPorLinha){
                                    i.destroy()
                                }
                        }, this);
                        this.adicionarLinha();
                    }, this)
                }
            }, null, this);
        }
    }
}