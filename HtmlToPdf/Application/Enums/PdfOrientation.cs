using System.Text.Json.Serialization;

namespace HtmlToPdf.Application.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PdfOrientation
{
    Portrait,
    Landscape
}
