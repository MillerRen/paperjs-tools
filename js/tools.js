(function () { // 画圆工具
    var Path = paper.Path;
    var tool = new paper.Tool({
        name: 'circle'
    });

    tool.onMouseDrag = function onMouseDrag(event) {
        var path = new Path.Circle({
            center: event.downPoint,
            radius: event.downPoint.getDistance(event.point)
        });

        path.removeOnDrag();
    };
})();

(function () { // 多边形工具
    var Path = paper.Path;
    var tool = new paper.Tool({
        name: 'polygon'
    });

    tool.onMouseDrag = function onMouseDrag(event) {
        var path = new Path.RegularPolygon({
            sides: 5,
            center: event.downPoint,
            radius: event.downPoint.getDistance(event.point)
        });

        path.removeOnDrag();
    };
})();

(function () { // 星形工具
    var Path = paper.Path;
    var tool = new paper.Tool({
        name: 'star'
    });

    tool.onMouseDrag = function onMouseDrag(event) {
        var path = new Path.Star({
            points: 5,
            center: event.downPoint,
            radius1: event.downPoint.getDistance(event.point),
            radius2: event.downPoint.getDistance(event.point) / 2
        });

        path.removeOnDrag();
    };
})();

(function () { // 画矩形工具
    var Path = paper.Path;
    var tool = new paper.Tool({
        name: 'rect'
    });

    tool.onMouseDrag = function onMouseDrag(event) {
        var path = new Path.Rectangle({
            from: event.downPoint,
            to: event.point
        });

        path.removeOnDrag();
    };

})();

(function () { // 直线工具
    var tool = new paper.Tool({
        name: 'line',

    });

    tool.onMouseDrag = function (event) {
        var tmp = new paper.Path.Line({
            from: event.downPoint,
            to: event.point
        });
        tmp.removeOn({
            drag: true,
            up: true
        });
    }

    tool.onMouseUp = function (event) {
        new paper.Path.Line({
            from: event.downPoint,
            to: event.point
        });
    }

})();

(function () { // 铅笔工具
    var Path = paper.Path;
    var path;
    var tool = new paper.Tool({
        name: 'pencil',

    });

    tool.onMouseDown = function (event) {
        path = new Path({
            strokeColor: '#009dec'
        });
        path.moveTo(event.point)
    }

    tool.onMouseDrag = function (event) {
        path.lineTo(event.point);
    }

    tool.onMouseUp = function (event) {
        path.smooth();
    }

})();

(function () { // 贝塞尔曲线工具

    var path;
    var types = ['point', 'handleIn', 'handleOut'];

    var tool = new paper.Tool({
        name: 'pen'
    });

    function findHandle(point) {
        for (var i = 0, l = path.segments.length; i < l; i++) {
            for (var j = 0; j < 3; j++) {
                var type = types[j];
                var segment = path.segments[i];
                var segmentPoint = type == 'point'
                    ? segment.point
                    : segment.point.add(segment[type]);
                var distance = (point.subtract(segmentPoint)).length;
                if (distance < 3) {
                    return {
                        type: type,
                        segment: segment
                    };
                }
            }
        }
        return null;
    }

    var currentSegment, mode, type;
    tool.onMouseDown = function (event) {
        if (currentSegment)
            currentSegment.selected = false;
        mode = type = currentSegment = null;

        if (!path) {
            path = new paper.Path();
        }

        var result = findHandle(event.point);
        if (result) {
            currentSegment = result.segment;
            type = result.type;
            if (path.segments.length > 1 && result.type == 'point'
                && result.segment.index == 0) {
                mode = 'close';
                path.closed = true;
                path.selected = false;
                path = null;
            }
        }

        if (mode != 'close') {
            mode = currentSegment ? 'move' : 'add';
            if (!currentSegment)
                currentSegment = path.add(event.point);
            currentSegment.selected = true;
        }
    }

    tool.onMouseDrag = function (event) {
        if (mode == 'move' && type == 'point') {
            currentSegment.point = event.point;
        } else if (mode != 'close') {
            var delta = event.delta.clone();
            if (type == 'handleOut' || mode == 'add')
                delta.x = -delta.x;
            delta.y = -delta.y;
            currentSegment.handleIn = currentSegment.handleIn.add(delta);
            currentSegment.handleOut = currentSegment.handleOut.subtract(delta);
        }
    }

})();

(function () { // 选择工具
    var hitResult = null;
    var guide;
    var hitOptions = {
        tolerance: 3,
        fill: true,
        stroke: true,
        // segments: true,
        curves: true,
        // handles: true,
        bounds: true,
        pixel: true
    };

    var tool = new paper.Tool({
        name: 'select'
    });

    tool.onMouseDown = function (event) {
        paper.project.selectedItems.forEach(function (item) {
            item.selected = false;
            item.bounds.selected = false;
        })
        hitResult = paper.project.hitTest(event.point, hitOptions);
        if (hitResult) {
            hitResult.item.selected = true;
            hitResult.item.bounds.selected = true;
        }
    };

    tool.onMouseDrag = function onMouseDrag(event) {
        if (!hitResult) {
            guide = new paper.Path.Rectangle({
                from: event.downPoint,
                to: event.point,
                strokeWidth: 1,
                strokeColor: '#ccc',
                fillColor: '#fff',
                dashArray: [3, 5]
            });
            guide.fillColor.alpha = 0.1;
            guide.removeOn({
                drag: true,
                up: true
            });
            // TODO: 多选与提示相交的形状
            return;
        }

        var item = hitResult.item;

        switch (hitResult.type) {
            case 'fill':
            case 'stroke':
            case 'curve':
            case 'pixel':
                item.position = item.position.add(event.delta);
                break;
            case 'bounds':
                var sx, xy;
                switch (hitResult.name) {
                    case 'top-left':
                        sx = (item.bounds.width - event.delta.x) / (item.bounds.width);
                        sy = (item.bounds.height - event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.bottomRight);
                        break;
                    case 'top-right':
                        sx = (item.bounds.width + event.delta.x) / (item.bounds.width);
                        sy = (item.bounds.height - event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.bottomLeft);
                        break;
                    case 'top-center':
                        sx = 1;
                        sy = (item.bounds.height - event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.bottomCenter);
                        break;
                    case 'bottom-left':
                        sx = (item.bounds.width - event.delta.x) / (item.bounds.width);
                        sy = (item.bounds.height + event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.topRight);
                        break;
                    case 'bottom-right':
                        sx = (item.bounds.width + event.delta.x) / (item.bounds.width);
                        sy = (item.bounds.height + event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.topLeft);
                        break;
                    case 'bottom-center':
                        sx = 1;
                        sy = (item.bounds.height + event.delta.y) / (item.bounds.height);
                        item.scale(sx, sy, item.bounds.topCenter);
                        break;
                    case 'left-center':
                        sx = (item.bounds.width - event.delta.x) / (item.bounds.width);
                        sy = 1;
                        item.scale(sx, sy, item.bounds.rightCenter);
                        break;
                    case 'right-center':
                        sx = (item.bounds.width + event.delta.x) / (item.bounds.width);
                        sy = 1;
                        item.scale(sx, sy, item.bounds.leftCenter);
                        break;
                }
                break;
            default:
                console.warn(hitResult.type + '未处理')
        }

    };

})();

(function () { // 详细选择工具
    var hitResult;

    var tool = new paper.Tool({
        name: 'detailselect'
    });

    var hitOptions = {
        stroke: true,
        segments: true,
        curves: true,
        handles: true,
        ends: true,
        fill: true,
        tolerance: 3
    }

    tool.onMouseDown = function (event) {
        paper.project.deselectAll();
        hitResult = paper.project.hitTest(event.point, hitOptions);
        if (hitResult) {
            hitResult.item.fullySelected = true;
        }
    };

    tool.onMouseDrag = function onMouseDrag(event) {
        if (!hitResult) return;
        var type = hitResult.type;
        var segment = hitResult.segment;
        console.log(type)
        switch (type) {
            case 'segment':
                segment.point = segment.point.add(event.delta);
                break;
            case 'handle-in':
                segment.handleIn = segment.handleIn.add(event.delta);
                break;
            case 'handle-out':
                segment.handleOut = segment.handleOut.add(event.delta);
                break;
        }
    };

})();

(function () { // 旋转工具
    var hitResult;
    var prevRotate;
    var tool = new paper.Tool({
        name: 'rotate'
    });

    var hitOptions = {
        stroke: true,
        segments: true,
        curves: true,
        handles: true,
        bounds: true,
        ends: true,
        fill: true,
        tolerance: 3
    }

    tool.onMouseDown = function (event) {
        paper.project.deselectAll();
        hitResult = paper.project.hitTest(event.point, hitOptions);
        if (hitResult) {
            hitResult.item.fullySelected = true;
        }
    };

    tool.onMouseDrag = function onMouseDrag(event) {
        if (!hitResult) return;
        var angle = event.point.subtract(hitResult.item.bounds.center).angle;
        hitResult.item.rotation = angle;
    };

})();
