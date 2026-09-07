import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'
import { Text } from './Text'

// The iOS segmented control: a pill track with a raised thumb that slides
// to the selected option. The track is measured rather than assumed, so it
// survives any font or padding the design system brings with it.

type Option<T extends string> = { value: T; label: string }

type SegmentedProps<T extends string> = {
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  accessibilityLabel?: string
}

const TRACK_PADDING = 2
const SEGMENT_HEIGHT = 34

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: TRACK_PADDING,
      gap: TRACK_PADDING,
      borderRadius: borderRadius.full,
      backgroundColor: colors.segmentTrack,
    },
    thumb: {
      position: 'absolute',
      top: TRACK_PADDING,
      bottom: TRACK_PADDING,
      left: TRACK_PADDING,
      borderRadius: borderRadius.full,
      backgroundColor: colors.segmentThumb,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    segment: {
      flex: 1,
      height: SEGMENT_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
    },
    segmentPressed: {
      opacity: 0.6,
    },
  })

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const animate = !useReducedMotion()

  const [trackWidth, setTrackWidth] = useState(0)
  const inner = trackWidth - TRACK_PADDING * 2
  const segmentWidth =
    trackWidth > 0 ? (inner - TRACK_PADDING * (options.length - 1)) / options.length : 0
  const index = Math.max(
    options.findIndex((option) => option.value === value),
    0
  )

  const offset = useSharedValue(0)
  useEffect(() => {
    const target = index * (segmentWidth + TRACK_PADDING)
    offset.set(
      animate ? withTiming(target, { duration: 240, easing: Easing.out(Easing.cubic) }) : target
    )
  }, [animate, index, offset, segmentWidth])

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }))

  return (
    <View
      style={styles.track}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {segmentWidth > 0 && (
        <Animated.View style={[styles.thumb, { width: segmentWidth }, thumbStyle]} pointerEvents="none" />
      )}
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [styles.segment, pressed && !selected && styles.segmentPressed]}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text
              variant="label"
              color={selected ? undefined : 'secondary'}
              weight={selected ? 'semibold' : 'medium'}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
