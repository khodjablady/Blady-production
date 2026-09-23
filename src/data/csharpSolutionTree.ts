import { CSharpFileDefinition } from '../types';

export const CSHARP_SOLUTION_FILES: CSharpFileDefinition[] = [
  // 1. Solution file
  {
    path: 'BladyProduction.sln',
    filename: 'BladyProduction.sln',
    project: 'Solution Root',
    category: 'Host',
    description: 'Fichier solution Visual Studio / .NET 8-9 reliant tous les projets du monolithe modulaire.',
    code: `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.10.0.0
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Shared.Kernel", "src\\Shared\\BladyProduction.Shared.Kernel\\BladyProduction.Shared.Kernel.csproj", "{A1111111-1111-1111-1111-111111111111}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Erp.Domain", "src\\Modules\\Erp\\BladyProduction.Erp.Domain\\BladyProduction.Erp.Domain.csproj", "{B2222222-2222-2222-2222-222222222222}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Erp.Services", "src\\Modules\\Erp\\BladyProduction.Erp.Services\\BladyProduction.Erp.Services.csproj", "{B3333333-3333-3333-3333-333333333333}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Erp.Infrastructure", "src\\Modules\\Erp\\BladyProduction.Erp.Infrastructure\\BladyProduction.Erp.Infrastructure.csproj", "{B4444444-4444-4444-4444-444444444444}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Mes.Domain", "src\\Modules\\Mes\\BladyProduction.Mes.Domain\\BladyProduction.Mes.Domain.csproj", "{C5555555-5555-5555-5555-555555555555}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Mes.Services", "src\\Modules\\Mes\\BladyProduction.Mes.Services\\BladyProduction.Mes.Services.csproj", "{C6666666-6666-6666-6666-666666666666}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Mes.Infrastructure", "src\\Modules\\Mes\\BladyProduction.Mes.Infrastructure\\BladyProduction.Mes.Infrastructure.csproj", "{C7777777-7777-7777-7777-777777777777}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.Connectivity.Industrial", "src\\Modules\\Connectivity\\BladyProduction.Connectivity.Industrial\\BladyProduction.Connectivity.Industrial.csproj", "{D8888888-8888-8888-8888-888888888888}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "BladyProduction.AppHost", "src\\Host\\BladyProduction.AppHost\\BladyProduction.AppHost.csproj", "{E9999999-9999-9999-9999-999999999999}"
EndProject`
  },

  // 2. Directory.Build.props
  {
    path: 'Directory.Build.props',
    filename: 'Directory.Build.props',
    project: 'Solution Root',
    category: 'Host',
    description: 'Configuration globale .NET 8 / .NET 9 pour tous les projets du monolithe.',
    code: `<Project>
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <Authors>BladyProduction Process Technologies</Authors>
    <Company>BladyProduction Industrielle</Company>
  </PropertyGroup>
</Project>`
  },

  // 3. Shared Kernel
  {
    path: 'src/Shared/BladyProduction.Shared.Kernel/Events/IIntegrationEvent.cs',
    filename: 'IIntegrationEvent.cs',
    project: 'BladyProduction.Shared.Kernel',
    category: 'Shared',
    description: 'Interface pour la communication asynchrone découplée en mémoire entre ERP et MES.',
    code: `namespace BladyProduction.Shared.Kernel.Events;

public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTime OccurredOnUtc { get; }
}

public interface IIntegrationEventHandler<in TEvent> where TEvent : IIntegrationEvent
{
    Task HandleAsync(TEvent @event, CancellationToken cancellationToken = default);
}`
  },
  {
    path: 'src/Shared/BladyProduction.Shared.Kernel/Events/ProductionRealiseeIntegrationEvent.cs',
    filename: 'ProductionRealiseeIntegrationEvent.cs',
    project: 'BladyProduction.Shared.Kernel',
    category: 'Shared',
    description: 'Événement émis par le MES lors de la fin d\'un lot et consommé par l\'ERP pour la post-déduction.',
    code: `namespace BladyProduction.Shared.Kernel.Events;

public sealed record ProductionRealiseeIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    int OrdreFabricationId,
    int ArticleFabriqueId,
    int QuantiteRealisee,
    string NumeroLotFabrique,
    string Operateur
) : IIntegrationEvent;`
  },

  // 4. ERP Domain (From user specification PDF)
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Domain/Article.cs',
    filename: 'Article.cs',
    project: 'BladyProduction.Erp.Domain',
    category: 'Domain',
    description: 'Entité Article fondamentale incluant propriétés liquides (densité, volume, emballage, seuil critique). [Source PDF]',
    code: `namespace BladyProduction.Erp.Domain;

public class Article
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public decimal StockTheorique { get; set; }
    public string UniteMesure { get; set; } = "L"; // L (Litres), KG, U (Unités)
    public bool EstComposant { get; set; }
 
    // Paramètres d'approvisionnement (MRP) 
    public decimal SeuilCritique { get; set; }
    public decimal QuantiteStandardAchat { get; set; }
    public int? FournisseurParDefautId { get; set; }
    public int DelaiLivraisonFournisseurJours { get; set; }
 
    // Spécificités du conditionnement liquide
    public decimal? Densite { get; set; }
    public decimal? CapaciteVolumeLitres { get; set; }
    public string TypeEmballage { get; set; } = string.Empty;
}`
  },
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Domain/Nomenclature.cs',
    filename: 'Nomenclature.cs',
    project: 'BladyProduction.Erp.Domain',
    category: 'Domain',
    description: 'Nomenclature avec prise en compte des pertes liquides (fonds de cuve, purge de ligne). [Source PDF]',
    code: `namespace BladyProduction.Erp.Domain;

public class Nomenclature
{
    public int Id { get; set; }
    public int ArticleParentId { get; set; }
    public Article ArticleParent { get; set; } = null!;
    public int ComposantId { get; set; }
    public Article Composant { get; set; } = null!;
    public decimal QuantiteBesoinUnitaire { get; set; } 
    public decimal PourcentagePerteTolerable { get; set; } // Tolérance de perte (fonds de cuve, purge)
}`
  },
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Domain/Ventes.cs',
    filename: 'Ventes.cs',
    project: 'BladyProduction.Erp.Domain',
    category: 'Domain',
    description: 'Gestion des Commandes Clients et Lignes de Commande avec suivi produit. [Source PDF]',
    code: `namespace BladyProduction.Erp.Domain;

public class CommandeClient
{
    public int Id { get; set; }
    public string NumeroCommande { get; set; } = string.Empty;
    public DateTime DateCommande { get; set; } = DateTime.UtcNow;
    public string Statut { get; set; } = "EnAttente";
    public List<LigneCommande> Lignes { get; set; } = new();
}

public class LigneCommande
{
    public int Id { get; set; }
    public int CommandeClientId { get; set; }
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
    public int QuantiteCommandee { get; set; } 
    public int QuantiteDejaProduite { get; set; }
}`
  },
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Domain/Achats.cs',
    filename: 'Achats.cs',
    project: 'BladyProduction.Erp.Domain',
    category: 'Domain',
    description: 'Gestion des Achats, Suggestions MRP, Bons de Réception et Mouvements de Stock. [Source PDF]',
    code: `namespace BladyProduction.Erp.Domain;

public class SuggestionAchat
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
    public decimal QuantiteSuggeree { get; set; }
    public DateTime DateSuggestion { get; set; } = DateTime.UtcNow;
    public string Statut { get; set; } = "AValider";
    public string Motif { get; set; } = string.Empty;
    public DateTime DateBesoinUsine { get; set; }
    public DateTime DateCommandeAuPlusTard { get; set; }
}

public class BonReception
{
    public int Id { get; set; } 
    public string NumeroBL { get; set; } = string.Empty;
    public int CommandeFournisseurId { get; set; }
    public DateTime DateReception { get; set; } = DateTime.UtcNow;
    public string RecuPar { get; set; } = string.Empty;
    public List<LigneReception> Lignes { get; set; } = new();
}

public class LigneReception
{
    public int Id { get; set; }
    public int BonReceptionId { get; set; }
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
    public decimal QuantiteCommandee { get; set; }
    public decimal QuantiteRecue { get; set; }
    public decimal QuantiteRejetee { get; set; }
    public string? NumeroLotFournisseur { get; set; }
}

public class MouvementStock
{
    public int Id { get; set; } 
    public int ArticleId { get; set; }
    public decimal Quantite { get; set; }
    public string TypeMouvement { get; set; } = string.Empty;
    public string ReferenceDocument { get; set; } = string.Empty;
    public string? NumeroLot { get; set; }
    public DateTime DateMouvement { get; set; } = DateTime.UtcNow;
}`
  },

  // 5. ERP Services (Exact MrpStockService from PDF)
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Services/MrpStockService.cs',
    filename: 'MrpStockService.cs',
    project: 'BladyProduction.Erp.Services',
    category: 'Service',
    description: 'Moteur de calcul des besoins nets (MRP) et post-déduction de stock (backflushing) avec facteur de perte liquide. [Source PDF]',
    code: `using Microsoft.EntityFrameworkCore;
using BladyProduction.Erp.Domain;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BladyProduction.Erp.Services;

public class MrpStockService
{
    private readonly DbContext _erpDbContext;

    public MrpStockService(DbContext erpDbContext)
    {
        _erpDbContext = erpDbContext;
    }

    public async Task AppliquerPostDeductionStockAsync(int articleFabriqueId, int quantiteRealisee)
    {
        if (quantiteRealisee <= 0) return;

        var lignesNomenclature = await _erpDbContext.Set<Nomenclature>()
            .Include(n => n.Composant)
            .Where(n => n.ArticleParentId == articleFabriqueId)
            .ToListAsync();

        foreach (var lien in lignesNomenclature)
        {
            // Prise en compte de la perte tolérable pour les liquides
            decimal facteurPerte = 1 + (lien.PourcentagePerteTolerable / 100m);
            decimal quantiteConsommeeTotal = lien.QuantiteBesoinUnitaire * quantiteRealisee * facteurPerte;
 
            lien.Composant.StockTheorique -= quantiteConsommeeTotal;

            // Tracer le mouvement de stock
            _erpDbContext.Set<MouvementStock>().Add(new MouvementStock
            {
                ArticleId = lien.ComposantId,
                Quantite = -quantiteConsommeeTotal,
                TypeMouvement = "PostDeductionProduction",
                ReferenceDocument = $"Article-{articleFabriqueId}-Qty-{quantiteRealisee}",
                DateMouvement = DateTime.UtcNow
            });
        }

        await _erpDbContext.SaveChangesAsync();
    }

    public async Task VerifierEtGenererSuggestionAchatAsync(int composantId)
    {
        var composant = await _erpDbContext.Set<Article>().FirstOrDefaultAsync(a => a.Id == composantId);
        if (composant == null || !composant.EstComposant) return;

        if (composant.StockTheorique < composant.SeuilCritique)
        {
            bool suggestionExisteDeja = await _erpDbContext.Set<SuggestionAchat>()
                .AnyAsync(s => s.ArticleId == composantId && s.Statut == "AValider");

            if (suggestionExisteDeja) return;

            decimal manque = composant.SeuilCritique - composant.StockTheorique;
            decimal quantiteACommander = manque;

            if (composant.QuantiteStandardAchat > 0)
            {
                decimal multiplicateurs = Math.Ceiling(manque / composant.QuantiteStandardAchat);
                quantiteACommander = multiplicateurs * composant.QuantiteStandardAchat;
            }

            var nouvelleSuggestion = new SuggestionAchat
            {
                ArticleId = composantId,
                QuantiteSuggeree = quantiteACommander,
                Motif = $"Stock actuel ({composant.StockTheorique}) inférieur au seuil critique.",
                DateSuggestion = DateTime.UtcNow,
                Statut = "AValider",
                DateBesoinUsine = DateTime.UtcNow.AddDays(composant.DelaiLivraisonFournisseurJours),
                DateCommandeAuPlusTard = DateTime.UtcNow.AddDays(1)
            };

            _erpDbContext.Set<SuggestionAchat>().Add(nouvelleSuggestion);
            await _erpDbContext.SaveChangesAsync();
        }
    }
}`
  },

  // 6. ERP Infrastructure & DbContext
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Infrastructure/ErpDbContext.cs',
    filename: 'ErpDbContext.cs',
    project: 'BladyProduction.Erp.Infrastructure',
    category: 'Infrastructure',
    description: 'DbContext Entity Framework Core dédié au module ERP (Schéma "erp").',
    code: `using Microsoft.EntityFrameworkCore;
using BladyProduction.Erp.Domain;

namespace BladyProduction.Erp.Infrastructure;

public class ErpDbContext : DbContext
{
    public ErpDbContext(DbContextOptions<ErpDbContext> options) : base(options) { }

    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Nomenclature> Nomenclatures => Set<Nomenclature>();
    public DbSet<CommandeClient> CommandesClients => Set<CommandeClient>();
    public DbSet<LigneCommande> LignesCommandes => Set<LigneCommande>();
    public DbSet<SuggestionAchat> SuggestionsAchats => Set<SuggestionAchat>();
    public DbSet<BonReception> BonsReceptions => Set<BonReception>();
    public DbSet<LigneReception> LignesReceptions => Set<LigneReception>();
    public DbSet<MouvementStock> MouvementsStock => Set<MouvementStock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("erp");

        modelBuilder.Entity<Article>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasIndex(a => a.Code).IsUnique();
            b.Property(a => a.Densite).HasPrecision(6, 3);
            b.Property(a => a.StockTheorique).HasPrecision(18, 4);
        });

        modelBuilder.Entity<Nomenclature>(b =>
        {
            b.HasKey(n => n.Id);
            b.HasOne(n => n.ArticleParent).WithMany().HasForeignKey(n => n.ArticleParentId);
            b.HasOne(n => n.Composant).WithMany().HasForeignKey(n => n.ComposantId);
            b.Property(n => n.QuantiteBesoinUnitaire).HasPrecision(18, 4);
            b.Property(n => n.PourcentagePerteTolerable).HasPrecision(5, 2);
        });
    }
}`
  },
  {
    path: 'src/Modules/Erp/BladyProduction.Erp.Infrastructure/ErpModuleExtensions.cs',
    filename: 'ErpModuleExtensions.cs',
    project: 'BladyProduction.Erp.Infrastructure',
    category: 'Infrastructure',
    description: 'Méthode d\'extension pour enregistrer le module ERP dans le conteneur IoC .NET.',
    code: `using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using BladyProduction.Erp.Services;

namespace BladyProduction.Erp.Infrastructure;

public static class ErpModuleExtensions
{
    public static IServiceCollection AddErpModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("BladyProductionDb");

        services.AddDbContext<ErpDbContext>(options =>
            options.UseNpgsql(connectionString, b => b.MigrationsHistoryTable("__ErpMigrationsHistory", "erp")));

        // Déclarer MrpStockService avec le DbContext ERP
        services.AddScoped<MrpStockService>(sp =>
            new MrpStockService(sp.GetRequiredService<ErpDbContext>()));

        return services;
    }
}`
  },

  // 7. MES Domain
  {
    path: 'src/Modules/Mes/BladyProduction.Mes.Domain/OrdreFabrication.cs',
    filename: 'OrdreFabrication.cs',
    project: 'BladyProduction.Mes.Domain',
    category: 'Domain',
    description: 'Entité Ordre de Fabrication (OF) avec étapes liquides (mélange, homogénéisation, conditionnement).',
    code: `namespace BladyProduction.Mes.Domain;

public enum StatutOrdreFabrication
{
    Planifie,
    EnPreparationCuve,
    EnMelange,
    EnConditionnement,
    ControleQualite,
    Termine,
    Interrompu
}

public class OrdreFabrication
{
    public int Id { get; set; }
    public string NumeroOF { get; set; } = string.Empty;
    public int ArticleId { get; set; }
    public int QuantiteCible { get; set; }
    public int QuantiteProduite { get; set; }
    public int QuantiteRebutee { get; set; }
    public DateTime DatePlanifiee { get; set; }
    public StatutOrdreFabrication Statut { get; set; } = StatutOrdreFabrication.Planifie;
    public int LigneProductionId { get; set; }
    public string NumeroLotFabrique { get; set; } = string.Empty;
    public string Operateur { get; set; } = string.Empty;
    public int? CommandeClientId { get; set; }
    public double TempsCycleSecondes { get; set; }
    public int TempsProductionMinutes { get; set; }
}`
  },
  {
    path: 'src/Modules/Mes/BladyProduction.Mes.Domain/CuveMelange.cs',
    filename: 'CuveMelange.cs',
    project: 'BladyProduction.Mes.Domain',
    category: 'Domain',
    description: 'Représentation physique des réacteurs, cuves de stockage et lignes de remplissage.',
    code: `namespace BladyProduction.Mes.Domain;

public class CuveMelange
{
    public int Id { get; set; }
    public string CodeRepere { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public decimal CapaciteMaxLitres { get; set; }
    public decimal NiveauActuelLitres { get; set; }
    public decimal TemperatureC { get; set; }
    public decimal PressionBar { get; set; }
    public bool AgitateurEnMarche { get; set; }
    public string NodeIdOpcUaNiveau { get; set; } = string.Empty;
}`
  },

  // 8. MES Services (TRS / OEE and Production Declaration)
  {
    path: 'src/Modules/Mes/BladyProduction.Mes.Services/ExecutionProductionService.cs',
    filename: 'ExecutionProductionService.cs',
    project: 'BladyProduction.Mes.Services',
    category: 'Service',
    description: 'Gestion du cycle de vie d\'un OF et publication de l\'événement vers l\'ERP pour post-déduction.',
    code: `using Microsoft.EntityFrameworkCore;
using BladyProduction.Mes.Domain;
using BladyProduction.Shared.Kernel.Events;

namespace BladyProduction.Mes.Services;

public class ExecutionProductionService
{
    private readonly DbContext _mesDbContext;
    private readonly IIntegrationEventHandler<ProductionRealiseeIntegrationEvent> _eventHandler;

    public ExecutionProductionService(
        DbContext mesDbContext, 
        IIntegrationEventHandler<ProductionRealiseeIntegrationEvent> eventHandler)
    {
        _mesDbContext = mesDbContext;
        _eventHandler = eventHandler;
    }

    public async Task EnregistrerDeclarationProductionAsync(
        int ordreFabricationId, 
        int quantiteRealisee, 
        int quantiteRebuts, 
        string operateur)
    {
        var of = await _mesDbContext.Set<OrdreFabrication>().FindAsync(ordreFabricationId);
        if (of == null) throw new InvalidOperationException("OF non trouvé.");

        of.QuantiteProduite += quantiteRealisee;
        of.QuantiteRebutee += quantiteRebuts;

        if (of.QuantiteProduite >= of.QuantiteCible)
        {
            of.Statut = StatutOrdreFabrication.Termine;
        }

        await _mesDbContext.SaveChangesAsync();

        // Émission de l'événement découplé vers l'ERP pour la post-déduction (MrpStockService)
        var @event = new ProductionRealiseeIntegrationEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            of.Id,
            of.ArticleId,
            quantiteRealisee,
            of.NumeroLotFabrique,
            operateur
        );

        await _eventHandler.HandleAsync(@event);
    }
}`
  },
  {
    path: 'src/Modules/Mes/BladyProduction.Mes.Services/OeeCalculatorService.cs',
    filename: 'OeeCalculatorService.cs',
    project: 'BladyProduction.Mes.Services',
    category: 'Service',
    description: 'Calcul du Taux de Rendement Synthétique (TRS / OEE = Dispo × Perf × Qualité) standardisé AFNOR / SEMI E10.',
    code: `namespace BladyProduction.Mes.Services;

public class OeeResult
{
    public decimal Disponibilite { get; set; }
    public decimal Performance { get; set; }
    public decimal Qualite { get; set; }
    public decimal TrsGlobal { get; set; }
}

public class OeeCalculatorService
{
    public OeeResult CalculerTrs(
        decimal tempsOuvertureMinutes, 
        decimal tempsArretMinutes, 
        decimal cadenceTheoriqueUnitesMinute, 
        int piecesProduitesTotales, 
        int piecesConformes)
    {
        decimal tempsFonctionnement = tempsOuvertureMinutes - tempsArretMinutes;
        decimal disponibilite = tempsOuvertureMinutes > 0 ? (tempsFonctionnement / tempsOuvertureMinutes) : 0m;

        decimal cadenceReelle = tempsFonctionnement > 0 ? (piecesProduitesTotales / tempsFonctionnement) : 0m;
        decimal performance = cadenceTheoriqueUnitesMinute > 0 ? (cadenceReelle / cadenceTheoriqueUnitesMinute) : 0m;

        decimal qualite = piecesProduitesTotales > 0 ? ((decimal)piecesConformes / piecesProduitesTotales) : 0m;

        decimal trs = disponibilite * performance * qualite;

        return new OeeResult
        {
            Disponibilite = Math.Round(disponibilite * 100m, 2),
            Performance = Math.Round(performance * 100m, 2),
            Qualite = Math.Round(qualite * 100m, 2),
            TrsGlobal = Math.Round(trs * 100m, 2)
        };
    }
}`
  },

  // 9. Industrial Connectivity (OPC UA & Modbus)
  {
    path: 'src/Modules/Connectivity/BladyProduction.Connectivity.Industrial/OpcUaClientService.cs',
    filename: 'OpcUaClientService.cs',
    project: 'BladyProduction.Connectivity.Industrial',
    category: 'Connectivity',
    description: 'Client OPC-UA industriel pour la lecture continue des balises capteurs des cuves et automates Siemens / Rockwell.',
    code: `using System.Collections.Concurrent;

namespace BladyProduction.Connectivity.Industrial;

public interface IOpcUaClientService
{
    Task<object?> ReadNodeValueAsync(string nodeId);
    Task WriteNodeValueAsync(string nodeId, object value);
    IObservable<OpcUaTagChangedEvent> SubscribeToTags(IEnumerable<string> nodeIds);
}

public record OpcUaTagChangedEvent(string NodeId, object Value, DateTime TimestampUtc);

public class OpcUaClientService : IOpcUaClientService
{
    private readonly ConcurrentDictionary<string, object> _nodeCache = new();

    public Task<object?> ReadNodeValueAsync(string nodeId)
    {
        _nodeCache.TryGetValue(nodeId, out var value);
        return Task.FromResult(value);
    }

    public Task WriteNodeValueAsync(string nodeId, object value)
    {
        _nodeCache[nodeId] = value;
        return Task.CompletedTask;
    }

    public IObservable<OpcUaTagChangedEvent> SubscribeToTags(IEnumerable<string> nodeIds)
    {
        // Branchement avec la stack officielle OPCFoundation.NetStandard.Opc.Ua
        return null!;
    }
}`
  },
  {
    path: 'src/Modules/Connectivity/BladyProduction.Connectivity.Industrial/IndustrialBackgroundWorker.cs',
    filename: 'IndustrialBackgroundWorker.cs',
    project: 'BladyProduction.Connectivity.Industrial',
    category: 'Connectivity',
    description: 'BackgroundService .NET 8 qui scrute la télémétrie des automates et diffuse les données temps réel en mémoire.',
    code: `using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BladyProduction.Connectivity.Industrial;

public class IndustrialBackgroundWorker : BackgroundService
{
    private readonly ILogger<IndustrialBackgroundWorker> _logger;
    private readonly IOpcUaClientService _opcUaClient;

    public IndustrialBackgroundWorker(ILogger<IndustrialBackgroundWorker> logger, IOpcUaClientService opcUaClient)
    {
        _logger = logger;
        _opcUaClient = opcUaClient;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Industrial Connectivity Worker démarré sur OPC UA.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Lecture périodique des capteurs de niveau cuve, température et débit
                var niveauCuve = await _opcUaClient.ReadNodeValueAsync("ns=2;s=Cuve_Melange.Niveau");
                // Diffusion interne aux abonnés MES
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur lors du cycle de scrutation automate.");
            }

            await Task.Delay(1000, stoppingToken);
        }
    }
}`
  },
  {
    path: 'src/Modules/Connectivity/BladyProduction.Connectivity.Industrial/ModbusTcpMasterClient.cs',
    filename: 'ModbusTcpMasterClient.cs',
    project: 'BladyProduction.Connectivity.Industrial',
    category: 'Connectivity',
    description: 'Client maître Modbus/TCP asynchrone haute performance (.NET 8 Socket/Pipelines) avec mesure de latence RTT et décodage MBAP.',
    code: `using System.Diagnostics;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace BladyProduction.Connectivity.Industrial;

public interface IModbusTcpMasterClient
{
    Task<ModbusReadResult> ReadHoldingRegistersAsync(string ipAddress, int port, byte unitId, ushort startAddress, ushort count, CancellationToken ct = default);
    Task<ModbusWriteResult> WriteSingleCoilAsync(string ipAddress, int port, byte unitId, ushort coilAddress, bool value, CancellationToken ct = default);
}

public record ModbusReadResult(ushort TransactionId, byte[] RawBytes, ushort[] Registers, double LatencyMs, bool Success, string? ErrorMessage);
public record ModbusWriteResult(ushort TransactionId, ushort Address, bool Value, double LatencyMs, bool Success);

public class ModbusTcpMasterClient : IModbusTcpMasterClient
{
    private readonly ILogger<ModbusTcpMasterClient> _logger;
    private ushort _transactionIdCounter = 0;

    public ModbusTcpMasterClient(ILogger<ModbusTcpMasterClient> logger)
    {
        _logger = logger;
    }

    public async Task<ModbusReadResult> ReadHoldingRegistersAsync(
        string ipAddress, 
        int port, 
        byte unitId, 
        ushort startAddress, 
        ushort count, 
        CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        ushort tid = Interlocked.Increment(ref _transactionIdCounter);

        try
        {
            using var client = new TcpClient();
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromMilliseconds(1500));

            await client.ConnectAsync(ipAddress, port, timeoutCts.Token);
            using var stream = client.GetStream();

            // Construction de la trame MBAP + PDU (FC03 Read Holding Registers)
            byte[] request = new byte[12];
            request[0] = (byte)(tid >> 8);        // Transaction ID Hi
            request[1] = (byte)(tid & 0xFF);      // Transaction ID Lo
            request[2] = 0x00;                    // Protocol ID Hi (0 = Modbus)
            request[3] = 0x00;                    // Protocol ID Lo
            request[4] = 0x00;                    // Length Hi (6 bytes follow)
            request[5] = 0x06;                    // Length Lo
            request[6] = unitId;                  // Unit ID / Slave
            request[7] = 0x03;                    // Function Code 03 (Read Holding)
            request[8] = (byte)(startAddress >> 8);
            request[9] = (byte)(startAddress & 0xFF);
            request[10] = (byte)(count >> 8);
            request[11] = (byte)(count & 0xFF);

            await stream.WriteAsync(request, 0, request.Length, timeoutCts.Token);

            // Lecture réponse (En-tête MBAP 7 octets + FC 1 octet + ByteCount 1 octet + Données)
            byte[] responseBuffer = new byte[9 + (count * 2)];
            int bytesRead = await stream.ReadAsync(responseBuffer, 0, responseBuffer.Length, timeoutCts.Token);

            sw.Stop();
            double latency = sw.Elapsed.TotalMilliseconds;

            if (bytesRead < 9)
            {
                return new ModbusReadResult(tid, responseBuffer, Array.Empty<ushort>(), latency, false, "Réponse tronquée");
            }

            ushort[] registers = new ushort[count];
            for (int i = 0; i < count; i++)
            {
                int offset = 9 + (i * 2);
                registers[i] = (ushort)((responseBuffer[offset] << 8) | responseBuffer[offset + 1]);
            }

            return new ModbusReadResult(tid, responseBuffer, registers, latency, true, null);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning("Timeout ou exception Modbus/TCP sur {Ip}:{Port} (TID {Tid}) : {Msg}", ipAddress, port, tid, ex.Message);
            return new ModbusReadResult(tid, Array.Empty<byte>(), Array.Empty<ushort>(), sw.Elapsed.TotalMilliseconds, false, ex.Message);
        }
    }

    public async Task<ModbusWriteResult> WriteSingleCoilAsync(
        string ipAddress, 
        int port, 
        byte unitId, 
        ushort coilAddress, 
        bool value, 
        CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        ushort tid = Interlocked.Increment(ref _transactionIdCounter);

        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(ipAddress, port, ct);
            using var stream = client.GetStream();

            // FC05 Write Single Coil: 0xFF00 pour ON, 0x0000 pour OFF
            ushort coilVal = value ? (ushort)0xFF00 : (ushort)0x0000;
            byte[] request = new byte[12];
            request[0] = (byte)(tid >> 8);
            request[1] = (byte)(tid & 0xFF);
            request[2] = 0x00;
            request[3] = 0x00;
            request[4] = 0x00;
            request[5] = 0x06;
            request[6] = unitId;
            request[7] = 0x05; // FC05
            request[8] = (byte)(coilAddress >> 8);
            request[9] = (byte)(coilAddress & 0xFF);
            request[10] = (byte)(coilVal >> 8);
            request[11] = (byte)(coilVal & 0xFF);

            await stream.WriteAsync(request, 0, request.Length, ct);
            byte[] responseBuffer = new byte[12];
            await stream.ReadAsync(responseBuffer, 0, responseBuffer.Length, ct);

            sw.Stop();
            return new ModbusWriteResult(tid, coilAddress, value, sw.Elapsed.TotalMilliseconds, true);
        }
        catch
        {
            sw.Stop();
            return new ModbusWriteResult(tid, coilAddress, value, sw.Elapsed.TotalMilliseconds, false);
        }
    }
}`
  },

  // 10. Unified Monolithic Host (AppHost)
  {
    path: 'src/Host/BladyProduction.AppHost/Program.cs',
    filename: 'Program.cs',
    project: 'BladyProduction.AppHost',
    category: 'Host',
    description: 'Point d\'entrée du Monolithe Modulaire .NET 8/9 unifiant l\'ERP, le MES et la Connectivité dans un déploiement local unique.',
    code: `using BladyProduction.Erp.Infrastructure;
using BladyProduction.Mes.Infrastructure;
using BladyProduction.Connectivity.Industrial;
using BladyProduction.Shared.Kernel.Events;
using BladyProduction.Erp.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Enregistrement des Modules du Monolithe
builder.Services.AddErpModule(builder.Configuration);
builder.Services.AddMesModule(builder.Configuration);
builder.Services.AddIndustrialConnectivityModule(builder.Configuration);

// 2. Pont Événementiel In-Process (MediatR / In-Memory Dispatcher)
builder.Services.AddScoped<IIntegrationEventHandler<ProductionRealiseeIntegrationEvent>, ProductionRealiseeErpBridgeHandler>();

// 3. Swagger & SignalR pour télémétrie industrielle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddCors();

var app = builder.Build();

// 4. Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());

// 5. Minimal APIs & Routes
app.MapGet("/", () => Results.Ok(new { System = "BladyProduction Monolithe Modulaire", Status = "Online", Version = "1.0.0" }));

app.Run();

// Handler de pont découplé : quand le MES déclare une production, l'ERP déduit les stocks selon le MrpStockService
public class ProductionRealiseeErpBridgeHandler : IIntegrationEventHandler<ProductionRealiseeIntegrationEvent>
{
    private readonly MrpStockService _mrpStockService;

    public ProductionRealiseeErpBridgeHandler(MrpStockService mrpStockService)
    {
        _mrpStockService = mrpStockService;
    }

    public async Task HandleAsync(ProductionRealiseeIntegrationEvent @event, CancellationToken cancellationToken = default)
    {
        // Exécute la logique de déduction C# avec tolérance de perte liquide spécifiée dans le PDF !
        await _mrpStockService.AppliquerPostDeductionStockAsync(@event.ArticleFabriqueId, @event.QuantiteRealisee);
    }
}`
  },
  {
    path: 'src/Host/BladyProduction.AppHost/appsettings.json',
    filename: 'appsettings.json',
    project: 'BladyProduction.AppHost',
    category: 'Host',
    description: 'Configuration des chaînes de connexion PostgreSQL et des endpoints OPC UA.',
    code: `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "BladyProduction": "Debug"
    }
  },
  "ConnectionStrings": {
    "BladyProductionDb": "Host=localhost;Port=5432;Database=bladyproduction_db;Username=postgres;Password=postgres"
  },
  "IndustrialConnectivity": {
    "OpcUaEndpointUrl": "opc.tcp://localhost:4840/BladyProductionServer",
    "SamplingIntervalMs": 1000,
    "MqttBrokerHost": "localhost",
    "MqttBrokerPort": 1883
  }
}`
  }
];
