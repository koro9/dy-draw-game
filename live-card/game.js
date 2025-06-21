Card({
    data: {
        hasDrawn: false // 新增状态标记
    },
    created(options) {
        this.initCanvas();
        this.loadBackground();
    },

    initCanvas() {
        this.canvas = this.getCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.bgImage = null;
    },

    loadBackground() {
        const img = tt.createImage();
        img.src = '/live-card/drawing.png';
        img.onload = () => {
            this.bgImage = img;
            this.redrawBackground();
        };
    },

    redrawBackground() {
        if (this.bgImage) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    },

    onMessageFromMiniProgram(msg) {
        switch (msg.type) {
            case 'draw':
                if (!this.data.hasDrawn) {
                    this.clearBackground(); // 首次绘制时清除背景
                    this.data.hasDrawn = true;
                }
                //保存接收到的点
                if (!this.receivedPoints) this.receivedPoints = [];

                // 只在绘制结束时渲染
                if (!msg.isDrawing) {
                    this.receivedPoints = msg.points;
                    this.drawAllReceivedPoints(msg.color, msg.width);
                    this.receivedPoints = []; // 清空缓存
                }
                break;
            case 'clear':
                this.clearCanvas();
                break;
        }
    },

    clearBackground() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    // 新增函数：绘制所有接收到的点
    drawAllReceivedPoints(color, width) {
        if (!this.receivedPoints || this.receivedPoints.length < 4) return;
        
        this.ctx.strokeStyle = color || '#000000';
        this.ctx.lineWidth = width || 1;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();

        // 关键修改：连续绘制所有点
        this.ctx.moveTo(this.receivedPoints[0], this.receivedPoints[1]);
        for (let i = 2; i < this.receivedPoints.length; i += 2) {
            this.ctx.lineTo(this.receivedPoints[i], this.receivedPoints[i + 1]);
        }
        this.ctx.stroke();
    },

    drawPath(points, color, width) {
        this.ctx.strokeStyle = color || '#000000';
        this.ctx.lineWidth = width || 1;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();

        for (let i = 0; i < points.length; i += 2) {
            const x = points[i],
                y = points[i + 1];
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();
    },

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.redrawBackground(); // 关键：清屏后重绘背景
        this.data.hasDrawn = false
    }
})