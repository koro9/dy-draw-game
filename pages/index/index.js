const app = getApp()

Page({
    data: {
        canvasWidth: 300, // 画布宽度（需和 WXML 里 canvas 的 CSS 宽度一致）
        canvasHeight: 300, // 画布高度
        ctx: null,
        isDrawing: false, // 是否正在绘制
        lastX: 0, // 上一个点的 X 坐标
        lastY: 0, // 上一个点的 Y 坐标
        pathPoints: [], // 存储绘制点
        cardContext: null //存储Card实例
    },
    onLoad() {
        tt.createLiveCard({
            url: '/live-card/game',
            width: 150,
            height: 150,
            success: (res) => {
                console.info('Live card created!');
                app.globalCanvas = res.cardContext;
            },
            fail: (errMsg) => {
                console.error('Live card create failed:!', errMsg);
            },
        })
    },
    onReady() {
        this.initCanvas();
    },
    // 初始化 Canvas
    initCanvas() {
        const query = tt.createSelectorQuery();
        query.select('.main-canvas')
            .fields({
                node: true,
                size: true
            })
            .exec((res) => {
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                const dpr = tt.getSystemInfoSync().pixelRatio;

                canvas.width = this.data.canvasWidth * dpr;
                canvas.height = this.data.canvasHeight * dpr;
                ctx.scale(dpr, dpr);

                this.canvas = canvas;
                this.ctx = ctx;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            });
    },

    // 触摸开始（记录起点）
    testBindtouchstart(e) {
        const {
            x,
            y
        } = e.touches[0];
        this.setData({
            isDrawing: true,
            lastX: x,
            lastY: y
        });

        // 开始新路径并记录起点
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.data.pathPoints = [{
            x,
            y
        }]; // 重置路径点
    },

    // 触摸移动（绘制线条）
    testBindtouchmove(e) {
        if (!this.data.isDrawing) return;

        const {
            x,
            y
        } = e.touches[0];
        const {
            lastX,
            lastY
        } = this.data;

        // 实时绘制
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        // 记录所有点（不再采样）
        this.data.pathPoints.push({
            x,
            y
        });

        // 优化后的节流发送（按距离触发）
        const dx = x - lastX,
            dy = y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) { // 每移动5px发送一次
            this.throttledSend();
        }

        this.setData({
            lastX: x,
            lastY: y
        });
    },

    // 触摸结束（停止绘制）
    testBindtouchend() {
        this.setData({
            isDrawing: false
        });
        this.sendDrawingData(); // 确保发送最后一段
        this.data.pathPoints = []; // 重置路径点
    },

    throttledSend() {
        const now = Date.now();
        if (now - this.data.lastSendTime < 20) return; // 最小间隔20ms

        this.sendDrawingData();
        this.data.lastSendTime = now;
    },

    sendDrawingData() {
        if (!this.data.pathPoints.length || !app.globalCanvas) return;

        // 修改1：始终发送全部点（不再增量发送）
        const scale = Math.min(150/300, 150/300);
        const scaledPoints = this.data.pathPoints.flatMap(p => [
            Math.round(p.x  ),
            Math.round(p.y * scale )
        ]);

        // 修改2：添加isDrawing标记
        app.globalCanvas.onMessageFromMiniProgram({
            type: 'draw',
            points: scaledPoints,
            color: this.ctx.strokeStyle,
            width: this.ctx.lineWidth * scale,
            isDrawing: this.data.isDrawing // 添加绘制状态
        });
    },

    clearCanvas() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        app.globalCanvas.onMessageFromMiniProgram({
            type: 'clear'
        })
    },
})