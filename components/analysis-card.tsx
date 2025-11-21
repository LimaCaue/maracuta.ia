import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

interface AnalysisCardProps {
  title: string
  status: "safe" | "warning" | "critical"
  description: string
  details?: string[]
}

export function AnalysisCard({ title, status, description, details }: AnalysisCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "critical":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          badge: "Crítico",
        }
      case "warning":
        return {
          icon: Info,
          color: "text-orange-600",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          badge: "Atenção",
        }
      default:
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          badge: "Seguro",
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {title}
          </CardTitle>
          <Badge variant="outline" className={config.color}>
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {details && details.length > 0 && (
          <ul className="space-y-1 text-sm">
            {details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`mt-1 ${config.color}`}>•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
