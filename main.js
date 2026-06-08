// ===== MAIN.JS =====

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1200;

const PIXEL_STYLE = {
    fontFamily: "PressStart2P",
    color: "#ffffff"
};

class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    preload() {

        this.load.image("rover", "assets/rover.png");

        this.load.image("road", "assets/road.png");

        this.load.image(
            "polygonDanger",
            "assets/polygon_danger.png"
        );

        this.load.image(
            "polygonStatic",
            "assets/polygon_static.png"
        );
    }

    create() {

        this.cameras.main.setBackgroundColor("#cd111128");

        this.add.text(
            GAME_WIDTH / 2,
            120,
            "Robo Road",
            {
                ...PIXEL_STYLE,
                fontSize: "45px"
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            520,
            [
        "ПРАВИЛА",
        "",
        "• Управляйте дискретно",
        "",
        "• Реагируйте на STATIC",
        "",
        "• Реагируйте на DANGER",
        "",
        "• APPROVE разрешает проезд",
        "",
        "Время игры: 60 секунд"
    ],
    {
        ...PIXEL_STYLE,
        fontSize: "25px",
        align: "center"
    }
)
.setOrigin(0.5);

        const startBtn =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 180,
                380,
                100,
                0x1565c0
            );

        startBtn.setInteractive();
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 180,
            "TAKE CONTROL",
            {
               ...PIXEL_STYLE,
                fontSize: "25px"
            }
        ).setOrigin(0.5);

        startBtn.on("pointerdown", () => {

            this.scene.start("GameScene");
        });
    }
}

class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        this.gameFinished = false;

        this.waitingApprove = false;

        this.collisionModal = false;

        this.gameTime = 60;

        this.collisions = 0;

        this.gasHoldTime = 0;

        this.dangerApprovals = 0;

        this.totalReactionTime = 0;

        this.averageSpeedSum = 0;

        this.averageSpeedSamples = 0;

        // ===== SPEED =====

        this.speed = 0;

        this.maxSpeed = 5;

        this.acceleration = 0.12;

        this.friction = 0.05;

        this.steering = 8;

        // ===== ROAD =====

        this.road =
            this.add.tileSprite(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                720,
                GAME_HEIGHT,
                "road"
            );

        // ===== ROAD LIMITS =====

        this.leftRoadLimit = 80;

        this.rightRoadLimit = 640;

        // ===== ROVER =====

        this.rover =
            this.physics.add.sprite(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 190,
                "rover"
            );

        this.rover.setScale(0.26);

        this.rover.setDepth(10);

        // ===== KEYBOARD =====

        this.cursors =
            this.input.keyboard.createCursorKeys();

        this.keys =
            this.input.keyboard.addKeys({

                up:
                    Phaser.Input.Keyboard.KeyCodes.W,

                left:
                    Phaser.Input.Keyboard.KeyCodes.A,

                right:
                    Phaser.Input.Keyboard.KeyCodes.D
            });

        // ===== UI =====

        this.timerText =
            this.add.text(
                28,
                24,
                "01:00",
                {
                     ...PIXEL_STYLE,
                fontSize: "42px"
                }
            ).setDepth(100);

        this.speedText =
            this.add.text(
                28,
                82,
                "Speed: 0.0",
                {
                     ...PIXEL_STYLE,
                fontSize: "20px"
                }
            ).setDepth(100);

        // ===== GROUPS =====

        this.dangerGroup =
            this.physics.add.group();

        this.staticGroup =
            this.physics.add.group();

        // ===== SPAWN =====

        this.time.addEvent({

            delay: 7000,

            callback: this.spawnPolygon,

            callbackScope: this,

            loop: true
        });

        // ===== TIMER =====

        this.time.addEvent({

            delay: 1000,

            callback: () => {

                if (
                    this.gameFinished ||
                    this.waitingApprove ||
                    this.collisionModal
                ) {
                    return;
                }

                this.gameTime--;

                const minutes =
                    Math.floor(this.gameTime / 60);

                const seconds =
                    this.gameTime % 60;

                this.timerText.setText(
                    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
                );

                if (this.gameTime <= 0) {

                    this.finishGame();
                }
            },

            loop: true
        });
    }

    // ===== SPAWN =====

    spawnPolygon() {

        if (this.gameFinished) {
            return;
        }

        if (this.speed <= 0.1) {
            return;
        }

        const random =
            Phaser.Math.Between(0, 1);

        // ===== DANGER =====

        if (random === 0) {

            const polygon =
                this.dangerGroup.create(
                    GAME_WIDTH / 2,
                    -300,
                    "polygonDanger"
                );

            polygon.approved = false;

            polygon.triggered = false;

            polygon.setScale(1);
        }

        // ===== STATIC =====

        else {
            const blocked =
                this.staticGroup.getChildren().some(p =>
                p.y > 0 &&
                p.y < 700
            );

            if (blocked) {
                return;
            }

            const side =
                Phaser.Math.Between(0, 1);

            let x;

            if (side === 0) {

                x = 245;

            } else {

                x = 475;
            }

            const polygon =
                this.staticGroup.create(
                    x,
                    -300,
                    "polygonStatic"
                );
                polygon.hit = false;

                polygon.setScale(0.82);
            
        }
    }

    // ===== APPROVE =====

    showApproveModal(polygon) {

        this.waitingApprove = true;

        polygon.approveStartTime = 
            this.time.now;

        const bg =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                580,
                320,
                0x111111
            )
            .setStrokeStyle(4, 0xffffff)
            .setDepth(200);

        const title =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 - 70,
                "Разрешение проезда",
                {
                     ...PIXEL_STYLE,
                fontSize: "24px"
                }
            )
            .setOrigin(0.5)
            .setDepth(201);

        const button =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 80,
                280,
                90,
                0x1565c0
            )
            .setInteractive()
            .setDepth(201);

        const text =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 80,
                "APPROVE",
                {
                     ...PIXEL_STYLE,
                fontSize: "28px"
                }
            )
            .setOrigin(0.5)
            .setDepth(202);

        button.on("pointerdown", () => {

            polygon.approved = true;

            const reactionTime =
                (this.time.now -
                polygon.approveStartTime) / 1000;

                this.dangerApprovals++;

                this.totalReactionTime +=
                reactionTime;

            this.waitingApprove = false;

            this.speed = 1;

            bg.destroy();

            title.destroy();

            button.destroy();

            text.destroy();
        });
    }

    // ===== COLLISION =====

    showCollisionModal() {

        if (this.collisionModal) {
            return;
        }

        this.collisionModal = true;

        this.speed = 0;

        this.collisions++;

        const bg =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                620,
                420,
                0x111111
            )
            .setStrokeStyle(4, 0xffffff)
            .setDepth(200);

        const title =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 - 120,
                "INCIDENT DETECTED",
                {
              ...PIXEL_STYLE,
                fontSize: "32px"
                }
            )
            .setOrigin(0.5)
            .setDepth(201);

        const reportButton =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                360,
                90,
                0x1565c0
            )
            .setInteractive()
            .setDepth(201);

        const reportText =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                "SEND REPORT",
                {
                 ...PIXEL_STYLE,
                fontSize: "20px"
                }
            )
            .setOrigin(0.5)
            .setDepth(202);

        const coordButton =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 130,
                360,
                90,
                0x1565c0
            )
            .setInteractive()
            .setDepth(201);

        const coordText =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 130,
                "SEND COORDINATOR",
                {
                   ...PIXEL_STYLE,
                fontSize: "20px"
                }
            )
            .setOrigin(0.5)
            .setDepth(202);

reportButton.on("pointerdown", () => {

    this.showConfirmModal(
        "SEND REPORT?",
        () => {

            this.collisionModal = false;

            bg.destroy();
            title.destroy();

            reportButton.destroy();
            reportText.destroy();

            coordButton.destroy();
            coordText.destroy();
        }
    );
});

coordButton.on("pointerdown", () => {

    this.showConfirmModal(
        "SEND COORDINATOR?",
        () => {

            this.scene.start(
                "ResultScene",
                {
                    rating: "Игра завершена",
                    ratingColor: "#ff4444",
                    collisions: this.collisions
                }
            );
        }
    );
});
    }
    showConfirmModal(message, onYes) {

        const bg =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2,
                500,
                250,
                0x222222
            )
            .setStrokeStyle(4, 0xffffff)
            .setDepth(300);

        const text =
            this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 - 50,
                message,
                {
                    ...PIXEL_STYLE,
                    fontSize: "24px",
                    align: "center"
                }
            )
            .setOrigin(0.5)
            .setDepth(301);

        const yesButton =
            this.add.rectangle(
                GAME_WIDTH / 2 - 100,
                GAME_HEIGHT / 2 + 50,
                140,
                70,
                0x2e7d32
            )
            .setInteractive()
            .setDepth(301);

        const yesText =
            this.add.text(
                GAME_WIDTH / 2 - 100,
                GAME_HEIGHT / 2 + 50,
                "YES",
                {
                    ...PIXEL_STYLE,
                    fontSize: "20px"
                }
            )
            .setOrigin(0.5)
            .setDepth(302);

        const noButton =
            this.add.rectangle(
                GAME_WIDTH / 2 + 100,
                GAME_HEIGHT / 2 + 50,
                140,
                70,
                0xc62828
            )
            .setInteractive()
            .setDepth(301);

        const noText =
            this.add.text(
                GAME_WIDTH / 2 + 100,
                GAME_HEIGHT / 2 + 50,
            "NO",
                {
                ...PIXEL_STYLE,
                fontSize: "20px"
                }
            )
            .setOrigin(0.5)
            .setDepth(302);

        const close = () => {

            bg.destroy();
            text.destroy();

            yesButton.destroy();
            yesText.destroy();

            noButton.destroy();
            noText.destroy();
        };

        yesButton.on("pointerdown", () => {

            close();
            onYes();
        });

        noButton.on("pointerdown", () => {

            close();
        });
    }

    // ===== FINISH =====

    finishGame() {

        this.gameFinished = true;

        const average =
            this.averageSpeedSum /
            this.averageSpeedSamples;

        let rating = "";
        let ratingColor = "";
        if (average < 1.5) {
            rating =
                "Слишком медленно";
            ratingColor = "#ca5c5c";   
        } else if (
            average <= 3.5
        ) {
            rating =
                "Дискретно и безопасно";
            ratingColor = "#107903";
        } else {
            rating =
                "Небезопасно";
            ratingColor = "#d40c0c";
        }

        this.scene.start(
            "ResultScene",
            {
                rating: rating,
                ratingColor: ratingColor,
                collisions: this.collisions,
                gasHoldTime: this.gasHoldTime,

                dangerApprovals:
                this.dangerApprovals,

                totalReactionTime:
                this.totalReactionTime
            }
        );
    }

    update() {
        
        if (
            this.gameFinished ||
            this.waitingApprove ||
            this.collisionModal
        ) {
            return;
        }

        // ===== INPUT =====

        const gas =
            this.keys.up.isDown ||
            this.cursors.up.isDown;
            
            if (gas) {
                this.gasHoldTime +=
                this.game.loop.delta / 1000;
            }

        const left =
            this.keys.left.isDown ||
            this.cursors.left.isDown;

        const right =
            this.keys.right.isDown ||
            this.cursors.right.isDown;

        // ===== SPEED =====

        if (gas) {

            this.speed +=
                this.acceleration;

        } else {

            this.speed -=
                this.friction;
        }

        this.speed =
            Phaser.Math.Clamp(
                this.speed,
                0,
                this.maxSpeed
            );

        // ===== CONTROL =====

        let controlFactor = 1;

        if (this.speed > 5) {

            controlFactor = 0.42;

            this.rover.setAngle(
                Phaser.Math.Between(-2, 2)
            );

        } else {

            this.rover.setAngle(0);
        }

        // ===== MOVE =====

        if (left) {

            this.rover.x -=
                this.steering *
                controlFactor;
        }

        if (right) {

            this.rover.x +=
                this.steering *
                controlFactor;
        }

        // ===== ROAD LIMITS =====

        if (
            this.rover.x <
            this.leftRoadLimit
        ) {

            this.rover.x =
                this.leftRoadLimit + 18;

            this.speed *= 0.55;

            this.cameras.main.shake(
                120,
                0.004
            );
        }

        if (
            this.rover.x >
            this.rightRoadLimit
        ) {

            this.rover.x =
                this.rightRoadLimit - 18;

            this.speed *= 0.55;

            this.cameras.main.shake(
                120,
                0.004
            );
        }

        // ===== ROAD =====

        this.road.tilePositionY -=
            this.speed * 6;

        // ===== UI =====

        this.speedText.setText(
            "Speed: " +
            this.speed.toFixed(1)
        );

        // ===== SHAKE =====

        if (this.speed > 5) {

            this.cameras.main.shake(
                35,
                0.0012
            );
        }

        // ===== AVG =====

        this.averageSpeedSum +=
            this.speed;

        this.averageSpeedSamples++;

        // ===== DANGER =====

        this.dangerGroup.children.iterate(
            (polygon) => {

                if (!polygon) return;

                polygon.y +=
                    this.speed * 6;

                if (
                    polygon.y >
                    GAME_HEIGHT + 300
                ) {

                    polygon.destroy();
                }

                const distance =
                    polygon.y -
                    this.rover.y;

                if (
                    distance > -180 &&
                    distance < 50 &&
                    !polygon.approved &&
                    !polygon.triggered
                ) {

                    polygon.triggered = true;

                    this.speed = 0;

                    this.showApproveModal(
                        polygon
                    );
                }
            }
        );

        // ===== STATIC =====

        this.staticGroup.children.iterate(
            (polygon) => {

                if (!polygon) return;

                polygon.y +=
                    this.speed * 6;

                if (
                    polygon.y >
                    GAME_HEIGHT + 300
                ) {

                    polygon.destroy();
                }

                // ===== ACCURATE COLLISION =====

                const roverBounds =
                    this.rover.getBounds();

                const polygonBounds =
                    polygon.getBounds();

                const hit =
                    Phaser.Geom.Intersects.RectangleToRectangle(
                    roverBounds,
                    polygonBounds
                );

                if (
                    hit &&
                    !polygon.hit
                ) {

                    polygon.hit = true;

                    polygon.destroy();

                    this.showCollisionModal();
                }

            }
        );
    }
}

class ResultScene extends Phaser.Scene {

    constructor() {
        super("ResultScene");
    }

    init(data) {

        this.rating =
            data.rating;
        this.ratingColor = 
            data.ratingColor;
        this.collisions =
            data.collisions;

        this.gasHoldTime = data.gasHoldTime || 0;
        this.dangerApprovals =
            data.dangerApprovals || 0;

        this.totalReactionTime =
            data.totalReactionTime || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("#000");

        this.add.text(
            GAME_WIDTH / 2,
            180,
            "ИТОГИ",
            {
                 ...PIXEL_STYLE,
                fontSize: "54px"
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            320,
            "Управление",
            {
             ...PIXEL_STYLE,
                fontSize: "34px"
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            360,
            this.rating,
            {
                ...PIXEL_STYLE,
                fontSize: "24px",
                color: this.ratingColor
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            410,
            "Столкновений",
            {
                ...PIXEL_STYLE,
                fontSize: "34px"
            }
        ).setOrigin(0.5);

        this.add.text(
            GAME_WIDTH / 2,
            460,
            String(this.collisions),
            {
               ...PIXEL_STYLE,
                fontSize: "24px"
            }
        ).setOrigin(0.5);

        this.add.text(
    GAME_WIDTH / 2,
    510,
    "Газ удерживался",
    {
        ...PIXEL_STYLE,
        fontSize: "34px"
    }
).setOrigin(0.5);

this.add.text(
    GAME_WIDTH / 2,
    550,
    this.gasHoldTime.toFixed(1) + " сек",
    {
        ...PIXEL_STYLE,
        fontSize: "24px"
    }
).setOrigin(0.5);

        this.add.text(
    GAME_WIDTH / 2,
    600,
    "Обработано DANGER",
    {
        ...PIXEL_STYLE,
        fontSize: "34px"
    }
).setOrigin(0.5);

this.add.text(
    GAME_WIDTH / 2,
    640,
    String(this.dangerApprovals),
    {
        ...PIXEL_STYLE,
        fontSize: "24px"
    }
).setOrigin(0.5);
    
    const avgReaction =
    this.dangerApprovals > 0
        ? this.totalReactionTime /
          this.dangerApprovals
        : 0;

    this.add.text(
    GAME_WIDTH / 2,
    690,
    "Среднее время реакции",
    {
        ...PIXEL_STYLE,
        fontSize: "34px"
    }
).setOrigin(0.5);

this.add.text(
    GAME_WIDTH / 2,
    730,
    avgReaction.toFixed(1) + " сек",
    {
        ...PIXEL_STYLE,
        fontSize: "24px"
    }
).setOrigin(0.5);

        const restartBtn =
            this.add.rectangle(
                GAME_WIDTH / 2,
                GAME_HEIGHT - 170,
                320,
                100,
                0x1565c0
            );

        restartBtn.setInteractive();

        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT - 170,
            "RESTART",
            {
               ...PIXEL_STYLE,
                fontSize: "36px"
            }
        ).setOrigin(0.5);

        restartBtn.on("pointerdown", () => {

            this.scene.start("MenuScene");
        });
    }
}

const config = {

    type: Phaser.AUTO,

    width: GAME_WIDTH,

    height: GAME_HEIGHT,

    backgroundColor: "#000000",

    scale: {

        mode: Phaser.Scale.FIT,

        autoCenter:
            Phaser.Scale.CENTER_BOTH
    },

    physics: {

        default: "arcade",

        arcade: {

            debug: true
        }
    },

    scene: [
        MenuScene,
        GameScene,
        ResultScene
    ]
};

new Phaser.Game(config);
