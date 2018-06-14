var game;
var gameOptions = {
    //Altura do espaço para pontos em % do tamanho da tela
    alturaPontos: 0.08,
    //Altura do espaço de lançamento em % do tamanho da tela
    alturaPainelLancamento: 0.18,
    //tamanho da bola em % em relação ao tamanho da tela
    tamanhoBola: 0.03,
    //velocidade da bola
    velocidadeBola: 1000,
    //Quantidade de blocos por linha
    blocosPorLinha: 10,
    //Quantidade máxima de blocos exibidos por linha
    maxBlocosPorLinha: 4,
    //Chance de aparecer bônus bola extra
    probabilidadeBonusBolaExtra: 90
}
window.onload = function() {
    game = new Phaser.Game(640, 960, Phaser.CANVAS);
    game.state.add("PlayGame", playGame, true);
}
//State "PlayGame"
var playGame = function(){}
playGame.prototype = {
	preload: function(){
        //Carrega as imagens
        game.load.image("bola", "assets/bola.png");
        game.load.image("painel", "assets/painel.png");
        game.load.image("trajetoria", "assets/trajetoria.png");
        game.load.image("bloco", "assets/bloco.png");
	},
    create: function(){
        /*  Define configurações de escala e background, deixando o alinhamento
            vertical e horizontal no centro e a cor de fundo 0x202020 */
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = 0x202020;

        //Inicia sistema ARCADE Physics
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //Cria os grupos que serão utilizados pelo jogo
        this.grupoBlocos = game.add.group();
        this.grupoBolasExtras = game.add.group();
        this.grupoBolasASeremAdicionadas = game.add.group();
        this.grupoBolas = game.add.group();
        this.grupoCaindo = game.add.group();
        //Adiciona os dois grupos dentro do grupoCaindo
        this.grupoCaindo.add(this.grupoBlocos);
        this.grupoCaindo.add(this.grupoBolasExtras);

        /*  Define a área de pontuação colocando X e Y no canto superior esquerdo
            A largura como a mesma da largura da tela e a altura como a altura arrendondada
            da tela * o % decidido nas opções, neste caso 960*0.8=76,8 ou 77px*/
        this.areaPontuacao = game.add.sprite(0, 0, "painel");
        this.areaPontuacao.width = game.width;
        this.areaPontuacao.height = Math.round(game.height * gameOptions.alturaPontos);
        //Habilita física pra ela e deixa como imóvel
        game.physics.enable(this.areaPontuacao, Phaser.Physics.ARCADE);
        this.areaPontuacao.body.immovable = true;

        /*  Define a área de lançamento colocando X e Y no canto esquerdo (0) e Y em
            na parte debaixo da tela (game.height = 960)
            A largura como a mesma da largura da tela e a altura como a altura arrendondada
            da tela * o % decidido nas opções, neste caso 960*0.8=76,8 ou 77px*/
        this.painelLancamento = game.add.sprite(0, game.height, "painel");
        this.painelLancamento.width = game.width;
        this.painelLancamento.height = Math.round(game.height * gameOptions.alturaPainelLancamento);
        this.painelLancamento.anchor.set(0, 1); //Posiciona na parte de baixo da tela
        //Habilita física pra ela e deixa como imóvel
        game.physics.enable(this.painelLancamento, Phaser.Physics.ARCADE);
        this.painelLancamento.body.immovable = true;

        //Define o tamanho da bola de acordo com o % da largura tela EX: 640 * 0.03 = 28px
        var tamanhoBola = game.width * gameOptions.tamanhoBola;
        /*  Define a posição X e Y da bola inicial, neste caso, X na metade da largura da tela
            e Y no limite do tamanho do painel de lançamento menos a metade do tamanho da bola
            o que faz com que a bola fique exatamente na linha */
        this.adicionarBola(game.width / 2, game.height - this.painelLancamento.height - tamanhoBola / 2);

        /*  Adiciona a sprite da trajetória na posição X e Y do primeiro item do grupoBolas,
            ou seja, a primeira bola e define a âncora no meio de X e na parte debaixo de Y
            por último deixa o sprite invisível*/
        this.trajetoria = game.add.sprite(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y, "trajetoria");
        this.trajetoria.anchor.set(0.5, 1);
        this.trajetoria.visible = false;

        //Ao pressionar o mouse, chama a função mirarBola
        game.input.onDown.add(this.mirarBola, this);
        //Ao soltar o mouse chama a função dispararBola
        game.input.onUp.add(this.dispararBola, this);
        //Chama a função ajustarMira ao mexer o mouse
        game.input.addMoveCallback(this.ajustarMira, this);

        //Define a situação inicial das variáveis mirando e atirando como falsas
        this.mirando = false;
        this.atirando = false;
        //Level inicial é 0
        this.level = 0;
        //Chama a função adicionarLinha
        this.adicionarLinha();
        //Define quantas bolas começarão no jogo
        this.bolasExtras = 10;
	},
    /*  Função para adicionar novas bolas ao jogo de acordo com X e Y da posição onde
        a última bola bateu no fundo da tela */
    adicionarBola: function(x, y){
        ///Define o tamamnho da bola e posição
        var tamanhoBola = game.width * gameOptions.tamanhoBola;
        var bola = game.add.sprite(x, y, "bola");
        bola.width = tamanhoBola;
        bola.height = tamanhoBola;
        bola.anchor.set(0.5);
        //Habilita ARCADE Physics
        game.physics.enable(bola, Phaser.Physics.ARCADE);
        //Habilita colisão da bola com os limites do mundo
        bola.body.collideWorldBounds = true;
        //Faz com a bola rebata onde bater
        bola.body.bounce.set(1);
        //Adiciona a bola criada ao grupoBolas
        this.grupoBolas.add(bola);
    },
    /*  Função que cria um tween que faz com que cada bola que já caiu mova-se
        para a mesma posição da primeira bola na parte de baixo */
    juntarBola: function(i){
        //Tween muda o X da bola que caiu e leva ele até o X da primeira bola caída
        var scrollTween = game.add.tween(i).to({
            x: this.grupoBolas.getChildAt(0).x
        }, 100, Phaser.Easing.Linear.None, true);
        //Depois que o tween completa-se, ele destrói a bola
        scrollTween.onComplete.add(function(i){
            i.destroy();
        }, this)
    },
    /*  Função que adiciona uma nova linha de blocos ao jogo, atualiza o level atual
        e decide se será acrescentado um bonus de bola nova ou não */
    adicionarLinha: function(){
        //Incrementa o level atual
        this.level ++;
        /*  Define o tamanho do bloco como a largura do jogo / pelos blocos por linha
            EX: 640 / 10 = 64px por bloco*/
        var tamanhoBloco = game.width / gameOptions.blocosPorLinha;
        //Array para cotabilizar os a posição que os blocos foram colocados em jogo
        var blocosColocados = [];
        //Define se será adicionado um bônus bola extra na linha
        var colocarBonusBolaExtra = false;
        /*  Pega um número aleatório entre 0 e 99 e se ele for menor do que a probabilidade
            de uma bola bonus, ele adiciona esse bônus bola extra à linha */
        if(game.rnd.between(0, 99) < gameOptions.probabilidadeBonusBolaExtra){
            colocarBonusBolaExtra = true;
        }
        /*  Looping que passa por cada possível bloco por linha e decide se vai colocar
            um novo bloco, bônus bola extra ou nenhum dos dois */
        for(var i = 0; i < gameOptions.maxBlocosPorLinha; i++){
            //A posição do bloco no array será entre 0 e a quantidade de blocos por linha
            var posicaoBloco = game.rnd.between(0, gameOptions.blocosPorLinha - 1);
            //Se a posição do bloco dentro do array for = -1
            if(blocosColocados.indexOf(posicaoBloco) == -1){
                //Adiciona essa posição dentro do array
                blocosColocados.push(posicaoBloco);
                //Se na posição atual, não for colocar um bônus bola extra
                if(!colocarBonusBolaExtra){
                    /*  Adiciona um novo bloco com o tamanho definido por tamanhobloco, a posição X como sendo
                        a posição do bloco * o tamanho dele + a metade do tamanho dele (assim pega exatamente o
                        meio do sprite, sendo que o primeiro bloco da esquerda fica em 
                        0 * 64 (primeira posicao * tamanho do bloco) + 64 / 2 (metade do tamanho do bloco) no caso, 32
                        Y fica na metade da altura do bloco + o limite debaixo da altura do placar */
                    var bloco = game.add.sprite(posicaoBloco * tamanhoBloco + tamanhoBloco / 2, tamanhoBloco / 2 + game.height * gameOptions.alturaPontos, "bloco");
                    bloco.width = tamanhoBloco;
                    bloco.height = tamanhoBloco;
                    bloco.anchor.set(0.5);
                    //O value do bloco é igual ao level atual dele
                    bloco.value = this.level
                    //Habilita ARCADE Physics ao bloco criado e deixa ele imóvel
                    game.physics.enable(bloco, Phaser.Physics.ARCADE);
                    bloco.body.immovable = true;
                    //Define a linha dele como 1
                    bloco.linhaAtual = 1;
                    //Adiciona o bloco ao grupo de blocos
                    this.grupoBlocos.add(bloco);
                    //adiciona o texto com o número do level (bloco.value) no centro do bloco
                    var text = game.add.text(0, 0, bloco.value, {
                        font: "bold 16px Arial",
                        align: "center"
                    });
                    text.anchor.set(0.5);
                    //Adiciona o texto ao objeto
		            bloco.addChild(text);
                }
                //Se for colocar um bônus bola extra
                else{
                    //Define a variável como falsa (pois já colocou o bonus)
                    colocarBonusBolaExtra = false;
                    //Define o tamanho do bonus
                    var tamanhoBonusBola = game.width * gameOptions.tamanhoBola;
                    // Adiciona o bonus no mesmo cálculo do bloco, já que ou vai ser bloco ou bonus ou nada
                    var bonusBolaExtra = game.add.sprite(posicaoBloco * tamanhoBloco + tamanhoBloco / 2, tamanhoBloco / 2 + game.height * gameOptions.alturaPontos, "bola");
                    bonusBolaExtra.width = tamanhoBonusBola;
                    bonusBolaExtra.height = tamanhoBonusBola;
                    bonusBolaExtra.anchor.set(0.5);
                    //Muda a cor do bonus já que o sprite é o mesmo
                    bonusBolaExtra.tint = 0xff8800;
                    //Habilita ARCADE Physics e deixa imóvel
                    game.physics.enable(bonusBolaExtra, Phaser.Physics.ARCADE);
                    bonusBolaExtra.body.immovable = true;
                    //Adiciona esse bônus bola extra ao grupo de bolas extras
                    this.grupoBolasExtras.add(bonusBolaExtra);
                    //Define a linha como 1
                    bonusBolaExtra.linhaAtual = 1;
                }
            }
        }
    },
    //Função que executa enquanto o jogador mira segurando o botão do mouse
    mirarBola: function(e){
        //Se não estiver atirando
        if(!this.atirando){
            //Está mirando
            this.mirando = true;
        }
    },
    //Função para ajustar a mira enquanto o jogador estiver segurando o botão do mouse
    ajustarMira: function(e){
        //Se estiver mirando
        if(this.mirando){
            /*  Pega o valor absoluto da diferença de distância X e Y entre a posição
                atual do mouse onde o jogador começou a clicar */
            var distX = Phaser.Math.difference(e.position.x, e.positionDown.x);
            var distY = Phaser.Math.difference(e.position.y, e.positionDown.y);

            /*  Se a distância Y for menor que 10, ou seja, quase não moveu e o mouse
                está acima da plataforma de lançamento + a metade da altura da bola
                EX: 960 - 172 - (28 / 2) = 774, ou seja, a trajetória só vai aparecer
                o jogador clicar e a posição do mouse estiver acima de 774px que é a
                linha limite do painel de lançamento  */
            if(distY > 10 && e.position.y < (game.height - this.painelLancamento.height - (this.grupoBolas.height / 2))){
                // Define a posição da trajetória no mesmo lugar (X e Y) onde as bolas estão agrupadas
                this.trajetoria.position.set(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y);
                //Passa a exibir o sprite da trajetória
                this.trajetoria.visible = true;
                //A direção é um ângulo do segmento (x1, y1) -> (x2, y2)

                //CÓDIGO ORIGINAL: this.direcao = Phaser.Math.angleBetween(e.position.x, e.position.y, e.positionDown.x, e.positionDown.y);
                /*  Modifiquei o código para que ele mirasse na mesma posição do mouse
                    Ele calcula a posição X e Y do mouse em relação a posição X e Y
                    do grupo de bolas */
                this.direcao = Phaser.Math.angleBetween(e.position.x, e.position.y, this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y);

                //O ângulo da trajetória passa a ser a direção convertida pra radianos - 90
                this.trajetoria.angle = Phaser.Math.radToDeg(this.direcao) - 90;
            }
            //Se não tiver clicado e arrastado um pouco nem com o mouse acima da linha
            else {
                //Não exibe a trajetória
                this.trajetoria.visible = false;
            }
        }
    },
    //Função que dispara as bolas ao soltar o mouse (input.onUp)
    dispararBola: function(){
        //Se a trajetória estiver vazia
        if(this.trajetoria.visible){
            //Contador de bolas que já saíram de jogo
            this.bolasCaidas = 0;
            //O ângulo do tiro é o mesmo da trajetória em radianos
            var anguloDoTiro = Phaser.Math.degToRad(this.trajetoria.angle - 90);
            /*  Posição do tiro é o ponto onde está o grupo de bolas parado na
                base de lançamento */
            var posicaoDoTiro = new Phaser.Point(this.grupoBolas.getChildAt(0).x, this.grupoBolas.getChildAt(0).y);
            //Contador de bolas disparadas
            var bolasDisparadas = 0;
            //fireLoop é o evento que vai acontecer enquanto durante X tempo houver bolas extras
            var fireLoop = game.time.events.loop(Phaser.Timer.SECOND / 10, function(){
                //Incrementa a quantidade de bolasDisparadas para ir contando quantas já foram disparadas
                bolasDisparadas++;
                //Se houver mais bolas disparadas do que bolas extras
                if(bolasDisparadas > this.bolasExtras){
                    //Encerra o evento de disparar as bolas (fireLoop)
                    game.time.events.remove(fireLoop);
                }
                //Senão, ou seja, ainda há bolas extras que não foram disparadas
                else{
                    //Dispara uma nova bola chamando a função adicionarBola
                    this.adicionarBola(posicaoDoTiro.x, posicaoDoTiro.y);
                    /*  Pega o elemento do grupoBolas atual (this.grupoBolas.children.length - 1), 
                        ou seja, a próxima bola que será disparada e define a velocidade dela
                        (body.velocity.set(X, Y)) */
                    this.grupoBolas.getChildAt(this.grupoBolas.children.length - 1).body.velocity.set(gameOptions.velocidadeBola * Math.cos(anguloDoTiro), gameOptions.velocidadeBola * Math.sin(anguloDoTiro));
                }
            }, this);
            /*  Pega o primeiro elemento do grupoBolas atual (this.grupoBolas.children.length - 1), 
                ou seja, a próxima bola que será disparada e define a velocidade dela
                (body.velocity.set(X, Y)) */
            this.grupoBolas.getChildAt(0).body.velocity.set(gameOptions.velocidadeBola * Math.cos(anguloDoTiro), gameOptions.velocidadeBola * Math.sin(anguloDoTiro));
            //Define atirando como true, ou seja, está atirando
            this.atirando = true;
        }
        //Ao disparar, mirando passa a ser falso
        this.mirando = false;
        //E para de exibir a trajetória
        this.trajetoria.visible = false;
    },
    update: function(){
        //Se estiver atirando
        if(this.atirando){
            //Ativa a colisão entre as bolas e área de pontuação
            game.physics.arcade.collide(this.grupoBolas, this.areaPontuacao);
            game.physics.arcade.collide(this.grupoBolas, this.grupoBlocos, function(bola, bloco){                
                //Diminui o value do bloco, ou seja, a 'vida' dele
                bloco.value --;
                //Se o value for 0, destrói o bloco
                if(bloco.value == 0){
                bloco.destroy();
                }
                //Caso contrário, altera o texto para o novo value dele.
                else{
                    bloco.getChildAt(0).text = bloco.value;
                }
            }, null, this);
            //Função para definir o que fazer qundo algum objeto do grupoBolas passar por (overlap) algum outro do grupoBolasExtras
            game.physics.arcade.overlap(this.grupoBolas, this.grupoBolasExtras, function(bola, extraBall){
                //Adiciona um novo objeto(extraBall) ao grupoBolasASeremAdicionadas
                this.grupoBolasASeremAdicionadas.add(extraBall)
                /*  Tween que executa quando uma bola se choca com a bônus bola extra, fazendo com que essa bônus bola extra desça
                    até a painel de lançamento. O Y é onde a bola vai parar, e o X é o mesmo que a posição atual dessa
                    bônus bola extra. Y = a altura do jogo - a altura do painel de lançamento - a metade da largura do jogo
                    multiplicado pelo tamanho da bola, no caso 960 - 173 - (640* 0.03) / 2 = 777, depois disso, altera
                    a cor (tint) da imagem */
                var scrollTween = game.add.tween(extraBall).to({
                    y: game.height - this.painelLancamento.height - (game.width * gameOptions.tamanhoBola) / 2
                }, 200, Phaser.Easing.Linear.None, true);
                scrollTween.onComplete.add(function(e){
                    e.tint = 0xffffff;
                }, this)
            }, null, this);
            //Quando uma bola colidir com o painel de Lançamento
            game.physics.arcade.collide(this.grupoBolas, this.painelLancamento, function(painel, bola){
                //Define a velocidade do objeto como 0, ou seja, pára ela
                bola.body.velocity.set(0);
                //Se não houver nenhuma bola caída
                if(this.bolasCaidas == 0){
                    //Altera a posição de exibição da bola
                    this.grupoBolas.swapChildren(bola, this.grupoBolas.getChildAt(0));
                }
                else{
                    //Caso já exista uma bola caída no painel de lançamento, chama a função juntarBola
                    this.juntarBola(bola);
                }
                //Aumenta a número de bolas caídas
                this.bolasCaidas++;
                //Se a quantidade de bolas caídas for maior que a de bolas extrassssss
                if(this.bolasCaidas > this.bolasExtras){
                    /*  Para cada nova bola extra a ser adicionada ao conjunto de bolas extras 
                        aumenta o número de bolasExtras e chama a função juntarBola() */
                    this.grupoBolasASeremAdicionadas.forEach(function(i){
                        this.bolasExtras++;
                        this.juntarBola(i);
                    }, this);
                    //Tween para resetar posição do grupoCaindo
                    var scrollTween = game.add.tween(this.grupoCaindo).to({
                        y: this.grupoCaindo.y + game.width / gameOptions.blocosPorLinha
                    }, 200, Phaser.Easing.Linear.None, true);
                    //Quando o tween terminaaa
                    scrollTween.onComplete.add(function(){
                        //Quer dizer que parou de atirar
                        this.atirando = false;
                        //Reseta posição Y
                        this.grupoCaindo.y = 0;
                        //Para cada bloco em jogo
                        this.grupoBlocos.forEach(function(i){
                            //Altera o Y do bloco adicionado a largura do jogo dividido pela quantide de blocos por linha
                            i.y += game.width / gameOptions.blocosPorLinha;
                            //Muda a linha atual pra +1
                            i.linhaAtual++;
                            //Se a linha atual do bloco for igual a quantidade de blocos por linha (FIM DE JOGO)
                            if(i.linhaAtual == gameOptions.blocosPorLinha){
                                //Reinicia o jogo
                                game.state.start("PlayGame");
                            }
                        }, this);
                        /*  Para cada bonus de Bola extra em tela, faz o mesmo que com os blocos porém se
                            a linhaAtual for a mesma que o limite, destrua o objeto, ou seja, o bônus já que
                            ele não foi coletado a tempo */
                        this.grupoBolasExtras.forEach(function(i){
                                i.y += game.width / gameOptions.blocosPorLinha;
                                i.linhaAtual++;
                                if(i.linhaAtual == gameOptions.blocosPorLinha){
                                    i.destroy()
                                }
                        }, this);
                        //Adiciona uma nova linha chamando a função adicionarLinha()
                        this.adicionarLinha();
                    }, this)
                }
            }, null, this);
        }
    }
}