using System.Text.Json.Serialization;

namespace HtmlToPdf.Application.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PdfFormat
{
    A4,
    A3,
    Letter,
    Legal
}
