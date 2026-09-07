import { Children, Fragment, isValidElement, useMemo, type PropsWithChildren, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'
import { Text } from './Text'

// The inset grouped list from iOS Settings: an optional uppercase header,
// then rows on one rounded surface, separated by hairlines. `ListGroup`
// draws the surface and the separators; `ListRow` is one row.

type ListGroupProps = PropsWithChildren<{
  header?: string
  /** A line under the group — a hint, or a notice after an action. */
  footer?: ReactNode
  style?: StyleProp<ViewStyle>
}>

type ListRowProps = {
  title: string
  /** The value on the right: a string in secondary text, or your own node. */
  detail?: ReactNode
  /** Something before the title — a swatch, an icon chip. */
  leading?: ReactNode
  /** Shows a chevron. Defaults to true when the row is pressable. */
  chevron?: boolean
  onPress?: () => void
  /** Tints the title — for a sign-in row (accent) or a sign-out one (danger). */
  tone?: 'default' | 'accent' | 'danger'
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

// A row is at least this tall, whatever it holds — the iOS list row height.
const ROW_MIN_HEIGHT = 52

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    group: {
      gap: spacing.xs + 2,
    },
    header: {
      paddingHorizontal: spacing.md + 2,
      textTransform: 'uppercase',
    },
    surface: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
      overflow: 'hidden',
    },
    footer: {
      paddingHorizontal: spacing.md + 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md,
    },
    separatorWithLeading: {
      marginLeft: spacing.md + 26 + spacing.sm + 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      minHeight: ROW_MIN_HEIGHT,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowPressed: {
      backgroundColor: colors.segmentTrack,
    },
    title: {
      flex: 1,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    disabled: {
      opacity: 0.5,
    },
  })

export function ListGroup({ header, footer, style, children }: ListGroupProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const rows = Children.toArray(children).filter(isValidElement)

  return (
    <View style={[styles.group, style]}>
      {header ? (
        <Text variant="caption" color="secondary" style={styles.header}>
          {header}
        </Text>
      ) : null}
      <View style={styles.surface}>
        {rows.map((row, index) => {
          const hasLeading =
            isValidElement<ListRowProps>(row) && row.props.leading !== undefined
          return (
            <Fragment key={row.key ?? index}>
              {index > 0 && (
                <View style={[styles.separator, hasLeading && styles.separatorWithLeading]} />
              )}
              {row}
            </Fragment>
          )
        })}
      </View>
      {footer ? (
        typeof footer === 'string' ? (
          <Text variant="caption" color="secondary" style={styles.footer}>
            {footer}
          </Text>
        ) : (
          <View style={styles.footer}>{footer}</View>
        )
      ) : null}
    </View>
  )
}

export function ListRow({
  title,
  detail,
  leading,
  chevron,
  onPress,
  tone = 'default',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const showChevron = chevron ?? onPress !== undefined
  const titleColor = tone === 'accent' ? 'accent' : tone === 'danger' ? 'danger' : undefined

  const content = (
    <>
      {leading}
      <Text variant="body" color={titleColor} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.trailing}>
        {typeof detail === 'string' ? (
          <Text variant="body" color="secondary" numberOfLines={1}>
            {detail}
          </Text>
        ) : (
          detail
        )}
        {showChevron && <Ionicons name="chevron-forward" size={16} color={colors.tertiary} />}
      </View>
    </>
  )

  if (!onPress) {
    return <View style={[styles.row, disabled && styles.disabled]}>{content}</View>
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {content}
    </Pressable>
  )
}
