import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';


// import * as d3 from 'd3';
const d3 = require('../../vendor/d3')
// const { default: d3 } = await import('')

// import dynamic from 'next/dynamic'

// const d3 = dynamic(() => import('d3'), { ssr: false })

// const d3 = Object.assign({}, import('d3-array'))


import { Duration, DateTime } from 'luxon'

import { v4 as uuidv4 } from 'uuid';
import styles from './styles.module.css'

import * as _ from 'lodash'

const SCALE = 18.
export const PROFILE = {
    targetRange: {
        bgHigh: 14.4 * SCALE,
        bgTargetTop: 10 * SCALE,
        bgTargetBottom: 5.0 * SCALE,
        bgLow: 4.0 * SCALE
    }
}

export function intervalSearch(intervals, x) {
    let y = _.last(intervals)
    for (let [bound, value] of intervals) {
        if (x > bound) y = value
    }
    return y
}

export function Chart (props) {
    let onEndBrush = props.onEndBrush || identity
    const data = _.sortBy(props.data, 'date')

    const annotations = props.annotations || []
    const events = props.events || []
    const basalSeries = props.basalSeries || []
    const userProfile = PROFILE

    // Layout.
    // 
    const margin = {
        top: 30,
        bottom: 30,
        left: 40,
        right: 40
    }

    const width = 1200
    const height = 400


    // 
    // x and y curves.
    // 

    // Domain is supposed to be a full day by default.
    let extent = d3.extent(data, function (d) { return d.date })
    function calcExtent(extent, dynamicExtent) {
        if (dynamicExtent) return extent
        let start = DateTime.fromJSDate(new Date(extent[0])).set({
            hour: 0,
            minute: 0
        })
        let end = start.plus({ days: 1 })
        return [
            start.toMillis(),
            end.toMillis()
        ]
    }

    const x = d3.scaleTime()
        .domain(calcExtent(extent, props.dynamicExtent))
        .range([margin.left, width - margin.right])
        .clamp(true)

    const y = d3.scaleLinear()
        .domain([0, 23])
        .range([height - margin.bottom, margin.top])


    const yAxisRef = el => {
        const yAxis = d3.axisLeft(y)
        d3.select(el).call(yAxis)
    }

    const xAxisRef = el => {
        let yAxis = d3.axisBottom(x)
        if (!props.dynamicExtent) {
            let flip = false
            yAxis = yAxis
                .ticks(d3.timeMinute.every(120))
                .tickFormat(x => {
                    flip = !flip
                    if (flip) return ''
                    const timeStr = d3.timeFormat("%I %p")(x)
                    if (timeStr[0] === '0') return timeStr.slice(1)
                    return timeStr
                })
        }
        d3.select(el).call(yAxis)
    }

    const bgLine = d3.line()
        // .curve(d3.curveLinear)
        .curve(d3.curveCatmullRomOpen)
        .defined(d => d.sgv != 0)
        .x(function (d) { return x(d.date) })
        .y(function (d) { return y(d.sgv) })


    // The most ridiculously simple hack.
    const bglColorId = `bg-color-${uuidv4()}`

    const bgLineStops = [
        [0, 'red'],
        [userProfile.targetRange.bgLow / 18., 'orange'],
        [userProfile.targetRange.bgTargetBottom / 18., 'green'],
        [userProfile.targetRange.bgTargetTop / 18., 'orange'],
        [userProfile.targetRange.bgHigh / 18., 'red']
    ]


    const inRangeShapeDescription = {
        start: userProfile.targetRange.bgTargetBottom / 18.,
        end: userProfile.targetRange.bgTargetTop / 18.
    }

    const svgRef = el => {
        if (!el) return
        // Add brushing
        d3.select(el)
            .call(d3.brushX()
                .extent(
                    [[0 + margin.left, 0 + margin.top],
                    [width - margin.right, height - margin.top]
                    ])
                .on("end", function () {
                    let extent = d3.event.selection
                    if (extent != null) {
                        onEndBrush(extent.map(x.invert))
                    } else {
                        onEndBrush(extent)
                    }
                })
            )
    }

    const yIdx = d3.bisector(d => d.date).right

    const transformedEvents = events
        .filter(event => {
            switch (event.eventType) {
                case 'Meal Bolus':
                case 'Correction Bolus':
                    return true
                default:
                    return false
            }
        })

    function bgY(date) {
        const yi = yIdx(data, date)
        if (yi === 0) return data[yi]
        else return data[yi - 1]
    }

    return <div className={styles.chart}>
        <svg className={styles.bgChart} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={0}>
            {/* Axes. */}
            <g ref={xAxisRef} transform={`translate(0, ${height - margin.bottom})`}>
            </g>

            <g ref={yAxisRef} transform={`translate(${margin.left}, 0)`}>
            </g>

            {/* In range box. */}
            <rect
                x={margin.left}
                y={y(inRangeShapeDescription.end)}
                width={width - margin.right - margin.left}
                height={y(inRangeShapeDescription.start) - y(inRangeShapeDescription.end)}
                stroke='gray'
                fill='#7fff7f30' />

            <g ref={svgRef}>
                {/* Line */}
                <linearGradient
                    id={bglColorId}
                    gradientUnits="userSpaceOnUse"
                    x1={0}
                    x2={width}>
                    {data.map((d, i) => {
                        return <stop key={i} offset={x(d.date) / width} stopColor={intervalSearch(bgLineStops, d.sgv)} />
                    })}
                </linearGradient>
                
                {/* Coloured BG line for real data. */}
                <path
                    d={bgLine(data)}
                    fill="none"
                    stroke={`url(#${bglColorId})`}
                    strokeWidth={2} />

                {/* 
                    Treatments. 
                */}

                {/* Carbohydrates. */}
                {transformedEvents.map((event, i) => {
                    let carbs
                    switch (event.eventType) {
                        case 'Meal Bolus':
                            carbs = event.carbs
                            break
                        default:
                            return null
                    }

                    if (!carbs) return

                    const date = new Date(event.created_at)
                    const CARB_SCALE_FACTOR = 3
                    const height = carbs * CARB_SCALE_FACTOR

                    return <g className={styles.carbsBar} transform={`translate(${x(date)}, ${y(0)})`}>
                        <rect y={-height} height={height} width="5"></rect>

                        <text y={-height - 20}>
                            {`${carbs}g`}
                        </text>
                    </g>
                })}

                {/* Insulin dosages. */}
                {transformedEvents.map((event, i) => {
                    let insulin
                    switch (event.eventType) {
                        case 'Meal Bolus':
                        case 'Correction Bolus':
                            insulin = event.insulin
                            break
                        default:
                            return null
                    }

                    if (!insulin) return

                    const date = new Date(event.created_at)
                    const INSULIN_SCALE_FACTOR = 15
                    const height = insulin * INSULIN_SCALE_FACTOR

                    return <g className={styles.insulinBar} transform={`translate(${x(date)}, ${y(0)})`}>
                        <rect y={-height} height={height} width="5"></rect>

                        <text y={-height - 20}>
                            {`${insulin.toFixed(1)}U`}
                        </text>
                    </g>
                })}

            </g>
        </svg>

        {props.showTempBasalChart &&
            <TempBasalChart
                extent={calcExtent(extent)}
                basalSeries={basalSeries}
            />
        }
    </div>
}

import { identity } from 'lodash'

export const TempBasalChart = ({ width = 1200, height = 300, extent, basalSeries, onEndBrush = identity, bgBrushExtent = null }) => {
    // Following the D3.js margin convention, mentioned here [1].
    // [1]: https://observablehq.com/@d3/margin-convention
    const margin = {
        top: 30,
        bottom: 30,
        left: 40,
        right: 40
    }

    const x = d3.scaleTime()
        .domain(extent)
        .range([margin.left, width - margin.right])

    const xAxisRef = el => {
        let xAxis = d3.axisBottom(x).ticks(5)
        d3.select(el).call(xAxis)
    }

    const MAX_TEMP_BASAL_UNITS = 6
    const y = d3.scaleLinear()
        .domain([0, MAX_TEMP_BASAL_UNITS])
        .range([height - margin.bottom, margin.top])
        // .range([height - margin.bottom, margin.top])
        // We clamp the range, as I've noticed Loop has erroneously recorded
        // a temp basal much above the user-defined safety limits. The basal was
        // 35U for 2mins or so. Clamping is a simple sanity check for this
        // behaviour, as it is usually replaced by a reasonable temp.
        .clamp(true)

    const yAxisRef = el => {
        let yAxis = d3.axisLeft(y)
        d3.select(el).call(yAxis)
    }

    const area = d3.area()
        .x(d => x(d.startTime))
        .y0(height - margin.bottom)
        .y1(d => y(d.rate))
        // .defined(d => d.rate !== 0)
        .curve(d3.curveStep)

    return <svg className={styles.tempBasalChart} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={0}>
        {/* Axes. */}
        <g ref={xAxisRef} transform={`translate(0, ${height - margin.bottom})`}>
        </g>

        <g ref={yAxisRef} transform={`translate(${margin.left}, 0)`}>
        </g>

        <path
            d={area(basalSeries)}
            class={styles.tempBasal} />
    </svg>
}
